import { supabase } from '../../lib/supabase';
import type { SiteInsightRow, InsightSeverity, InsightSource } from '../../lib/database.types';

/** Published insights for a site, in display order. */
export async function listSiteInsights(siteId: string): Promise<SiteInsightRow[]> {
  const { data, error } = await supabase
    .from('site_insights')
    .select('*')
    .eq('site_id', siteId)
    .eq('is_published', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}


export interface InsightInput {
  body: string;
  category: string | null;
  severity: InsightSeverity;
  source: InsightSource;
  modelName: string | null;
  author: string | null;
}

/**
 * Writes a finding.
 *
 * `source` is required rather than defaulting, because the difference between
 * a measurement, an interpretation and generated text is the whole point of
 * this table. A CHECK constraint additionally refuses a row claiming `model`
 * without naming the model.
 */
export async function createInsight(siteId: string, input: InsightInput): Promise<SiteInsightRow> {
  const { data: existing } = await supabase
    .from('site_insights')
    .select('display_order')
    .eq('site_id', siteId)
    .order('display_order', { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.display_order ?? 0) + 1;

  const { data, error } = await supabase
    .from('site_insights')
    .insert({
      site_id: siteId,
      body: input.body.trim(),
      category: input.category,
      severity: input.severity,
      source: input.source,
      model_name: input.source === 'model' ? input.modelName : null,
      author: input.author,
      display_order: nextOrder,
      is_published: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateInsight(
  id: string,
  patch: Partial<Pick<SiteInsightRow, 'body' | 'category' | 'severity' | 'is_published'>>
): Promise<SiteInsightRow> {
  const { data, error } = await supabase
    .from('site_insights')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteInsight(id: string): Promise<void> {
  const { error } = await supabase.from('site_insights').delete().eq('id', id);
  if (error) throw error;
}
