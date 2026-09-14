import { supabase, signedUrl } from '../../lib/supabase';
import type { ReportRow, SiteRow } from '../../lib/database.types';

const BUCKET = 'reports';

/**
 * Report history.
 *
 * Reports are the one thing in this app that is not publicly readable: a report
 * bundles a whole site into a single file, so it sits behind a login and is
 * served through short-lived signed URLs rather than a public path.
 */

export async function listReports(siteId: string): Promise<ReportRow[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** A time-limited link to download a stored report. */
export function reportDownloadUrl(row: ReportRow): Promise<string> {
  if (!row.storage_path) throw new Error('This report has no stored file.');
  return signedUrl(row.storage_bucket, row.storage_path, 3600);
}

export interface SaveReportInput {
  site: SiteRow;
  blob: Blob;
  title: string;
  params: Record<string, unknown>;
  metricsSnapshot: Record<string, unknown>;
  /** Null in open demo mode, where reports can be generated without an account. */
  userId: string | null;
}

/**
 * Stores a generated PDF and records it.
 *
 * The row is inserted as `pending` first, then flipped to `ready` once the file
 * is up. If the upload fails the row is marked `failed` with the reason, rather
 * than vanishing — a report that could not be produced is itself worth knowing
 * about, and a CHECK constraint stops a row claiming `ready` without a file.
 */
export async function saveReport(input: SaveReportInput): Promise<ReportRow> {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `${input.site.slug}/${stamp}-report.pdf`;

  const { data: pending, error: insertError } = await supabase
    .from('reports')
    .insert({
      site_id: input.site.id,
      title: input.title,
      status: 'pending',
      storage_bucket: BUCKET,
      params: input.params,
      metrics_snapshot: input.metricsSnapshot,
      generated_by: input.userId,
    })
    .select()
    .single();

  if (insertError) throw insertError;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, input.blob, { contentType: 'application/pdf', upsert: false });

  if (uploadError) {
    await supabase
      .from('reports')
      .update({ status: 'failed', error_message: uploadError.message })
      .eq('id', pending.id);
    throw new Error(`Report generated but could not be stored: ${uploadError.message}`);
  }

  const { data: ready, error: updateError } = await supabase
    .from('reports')
    .update({
      status: 'ready',
      storage_path: path,
      file_size_bytes: input.blob.size,
      generated_at: new Date().toISOString(),
    })
    .eq('id', pending.id)
    .select()
    .single();

  if (updateError) {
    // The file is up but the row could not be completed. Remove the orphan so
    // nothing is left in storage that no row points at.
    await supabase.storage.from(BUCKET).remove([path]);
    throw updateError;
  }

  return ready;
}

export async function deleteReport(row: ReportRow): Promise<void> {
  const { error } = await supabase.from('reports').delete().eq('id', row.id);
  if (error) throw error;

  if (row.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(row.storage_bucket)
      .remove([row.storage_path]);
    if (storageError) console.warn('[reports] file left in storage:', storageError.message);
  }
}
