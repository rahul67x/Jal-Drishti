import { jsPDF } from 'jspdf';
import { realGisMetrics, verifiedInsights } from '../data/realMetrics';

export interface ReportGenerationOptions {
  projectName?: string;
  studyAreaName?: string;
}

export const generateGeospatialReport = async (options?: ReportGenerationOptions): Promise<void> => {
  const projectName = options?.projectName || 'JalDrishti: Geospatial Water & Watershed Analytics';
  const studyAreaName = options?.studyAreaName || 'Saswad Watershed, Maharashtra';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm

  const addHeader = (pageNum: number) => {
    // Header background banner
    doc.setFillColor(24, 58, 42); // #183A2A Deep Forest Green
    doc.rect(0, 0, pageWidth, 24, 'F');

    // Accent line
    doc.setFillColor(53, 98, 75); // #35624B
    doc.rect(0, 24, pageWidth, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(projectName, margin, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(220, 238, 225);
    doc.text('Multi-Temporal Satellite Remote Sensing & Decision-Support Report', margin, 18);

    doc.setFontSize(8);
    doc.setTextColor(200, 220, 205);
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    doc.text(`Generated: ${dateStr} | Page ${pageNum} of 2`, pageWidth - margin, 18, { align: 'right' });
  };

  const addFooter = (pageNum: number) => {
    doc.setDrawColor(220, 225, 220);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(
      'JalDrishti Platform • Verified QGIS Raster Metrics • Presentation & Viva Safe',
      margin,
      pageHeight - 7
    );
    doc.text(`Page ${pageNum} of 2`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: Overview, Methodology & Verified Metrics
  // ==========================================
  addHeader(1);

  let y = 32;

  // Metadata Box
  doc.setFillColor(245, 248, 245);
  doc.setDrawColor(200, 220, 205);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(24, 58, 42);
  doc.text('ANALYSIS METADATA & COORDINATE REFERENCE SYSTEM', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(50, 50, 50);
  doc.text(
    `Study Area: ${studyAreaName}   |   CRS: ${realGisMetrics.metadata.crs}`,
    margin + 4,
    y + 10
  );
  doc.text(
    `Spatial Resolution: 10 m × 10 m (100 m²/px)   |   Extent: ${realGisMetrics.lulc2026.display.value} (${realGisMetrics.metadata.totalPixels.toLocaleString()} total analyzed pixels)`,
    margin + 4,
    y + 14.5
  );

  y += 24;

  // SECTION 1: METHODOLOGY & ARCHITECTURE
  doc.setFillColor(24, 58, 42);
  doc.rect(margin, y, 2.5, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(24, 58, 42);
  doc.text('1. SATELLITE METHODOLOGY & SOFTWARE ARCHITECTURE', margin + 5, y + 5);

  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);

  const methodologyText = [
    '• Satellite Sensor: European Space Agency (ESA) Sentinel-2 Multi-Spectral Instrument (MSI) Level-2A surface reflectance rasters.',
    '• Spectral Indices Calculated:',
    '   - NDVI (Normalized Difference Vegetation Index): (B08 - B04) / (B08 + B04) utilizing Band 8 (NIR, 842 nm) and Band 4 (Red, 665 nm) at 10m ground resolution.',
    '   - NDWI (Normalized Difference Water Index): (B03 - B08) / (B03 + B08) utilizing Band 3 (Green, 560 nm) and Band 8 (NIR, 842 nm) to delineate open water bodies.',
    '• Spatial GIS Processing: Analysis performed via standardized QGIS raster calculation, thresholding, and zonal pixel statistics.',
    '• Web GIS Architecture: The dashboard is built with React & TypeScript. The web application directly renders the GeoTIFF raster layers in the browser via geotiff.js onto Leaflet canvas overlays (GeoTIFF rasters are NOT converted to GeoJSON for map display). Verified summary metrics are strictly loaded from src/data/realMetrics.ts.',
  ];

  methodologyText.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, contentWidth - 4);
    doc.text(wrapped, margin + 2, y);
    y += wrapped.length * 3.8;
  });

  y += 4;

  // SECTION 2: VERIFIED MEASURED ANALYSIS RESULTS
  doc.setFillColor(24, 58, 42);
  doc.rect(margin, y, 2.5, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(24, 58, 42);
  doc.text('2. VERIFIED MEASURED ANALYSIS RESULTS (2023 vs 2026)', margin + 5, y + 5);

  y += 9;

  // Table 1: Multi-temporal comparison
  doc.setFillColor(24, 58, 42);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Target Indicator', margin + 3, y + 4.2);
  doc.text('2023 Baseline', margin + 55, y + 4.2);
  doc.text('2026 Current', margin + 95, y + 4.2);
  doc.text('Net Measured Change', margin + 135, y + 4.2);

  y += 6;

  const tableRows = [
    {
      indicator: 'Surface Water Area',
      val2023: `${realGisMetrics.water.year2023.areaHa} ha (1,253 px)`,
      val2026: `${realGisMetrics.water.year2026.areaHa} ha (303 px)`,
      change: `${realGisMetrics.water.netChangeHa} ha (${realGisMetrics.water.percentChange}%)`,
      bg: [255, 255, 255],
    },
    {
      indicator: 'Positive-NDVI Vegetation Area',
      val2023: `${realGisMetrics.vegetation.year2023.areaHa.toLocaleString()} ha (370,566 px)`,
      val2026: `${realGisMetrics.vegetation.year2026.areaHa.toLocaleString()} ha (365,168 px)`,
      change: `${realGisMetrics.vegetation.netChangeHa} ha (${realGisMetrics.vegetation.percentChange}%)`,
      bg: [248, 250, 248],
    },
    {
      indicator: 'Water Loss (2023 Water -> 2026 Non-Water)',
      val2023: '—',
      val2026: '954 pixels detected',
      change: `9.54 ha (95,400 m²)`,
      bg: [255, 255, 255],
    },
    {
      indicator: 'Water Gain (2023 Non-Water -> 2026 Water)',
      val2023: '—',
      val2026: '4 pixels detected',
      change: `0.04 ha (400 m²)`,
      bg: [248, 250, 248],
    },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  tableRows.forEach((row) => {
    doc.setFillColor(row.bg[0], row.bg[1], row.bg[2]);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setDrawColor(230, 235, 230);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 6, margin + contentWidth, y + 6);

    doc.setTextColor(40, 40, 40);
    doc.text(row.indicator, margin + 3, y + 4.2);
    doc.text(row.val2023, margin + 55, y + 4.2);
    doc.text(row.val2026, margin + 95, y + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 58, 42);
    doc.text(row.change, margin + 135, y + 4.2);
    doc.setFont('helvetica', 'normal');

    y += 6;
  });

  y += 6;

  // Table 2: 2026 LULC Distribution
  doc.setFillColor(24, 58, 42);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('LULC Class (2026 Analysis Extent)', margin + 3, y + 4.2);
  doc.text('Area (Hectares)', margin + 75, y + 4.2);
  doc.text('Area (Square Kilometers)', margin + 115, y + 4.2);
  doc.text('Share (%)', margin + 155, y + 4.2);

  y += 6;

  const lulcRows = [
    { name: 'Vegetation (Positive NDVI)', ha: '3,651.65 ha', km2: '36.52 km²', share: '98.14%', bg: [255, 255, 255] },
    { name: 'Other (Scrub, Barren, Fallow, Built-up)', ha: '66.31 ha', km2: '0.66 km²', share: '1.78%', bg: [248, 250, 248] },
    { name: 'Surface Water (NDWI Positive)', ha: '3.03 ha', km2: '0.03 km²', share: '0.08%', bg: [255, 255, 255] },
    { name: 'Total Analyzed Common Extent', ha: '3,721.00 ha', km2: '37.21 km²', share: '100.00%', bg: [240, 245, 240], bold: true },
  ];

  lulcRows.forEach((row) => {
    doc.setFillColor(row.bg[0], row.bg[1], row.bg[2]);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setDrawColor(230, 235, 230);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 6, margin + contentWidth, y + 6);

    if (row.bold) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(24, 58, 42);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
    }

    doc.text(row.name, margin + 3, y + 4.2);
    doc.text(row.ha, margin + 75, y + 4.2);
    doc.text(row.km2, margin + 115, y + 4.2);
    doc.text(row.share, margin + 155, y + 4.2);

    y += 6;
  });

  addFooter(1);

  // ==========================================
  // PAGE 2: Verified Insights & Presentation Disclosures
  // ==========================================
  doc.addPage();
  addHeader(2);

  y = 32;

  // SECTION 3: VERIFIED JALDRISHTI INSIGHTS
  doc.setFillColor(24, 58, 42);
  doc.rect(margin, y, 2.5, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(24, 58, 42);
  doc.text('3. VERIFIED JALDRISHTI SYNTHESIS INSIGHTS', margin + 5, y + 5);

  y += 9;

  const insightLabels = [
    'Detected Water-Area Contraction (Surface Water Extent)',
    'Vegetation Stability & Positive NDVI Coverage',
    'Watershed Decision-Support & Conservation Value',
  ];

  verifiedInsights.forEach((insight, idx) => {
    doc.setFillColor(248, 251, 248);
    doc.setDrawColor(200, 220, 205);
    doc.setLineWidth(0.3);

    const wrapped = doc.splitTextToSize(insight, contentWidth - 10);
    const boxHeight = wrapped.length * 4 + 11;

    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

    // Tag
    doc.setFillColor(53, 98, 75);
    doc.rect(margin + 3, y + 3, 2, 5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(24, 58, 42);
    doc.text(`Insight ${idx + 1}: ${insightLabels[idx]}`, margin + 7, y + 6.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(45, 45, 45);
    doc.text(wrapped, margin + 5, y + 12);

    y += boxHeight + 4;
  });

  y += 4;

  // SECTION 4: PRESENTATION / VIVA SAFE DISCLOSURES
  doc.setFillColor(24, 58, 42);
  doc.rect(margin, y, 2.5, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(24, 58, 42);
  doc.text('4. PRESENTATION & VIVA DISCLOSURES (ACADEMIC FRAMEWORK)', margin + 5, y + 5);

  y += 9;

  const disclosures = [
    {
      title: 'A. Verified Measured Analysis Results',
      points: [
        '• All surface water and vegetation statistics represent empirical measurements computed via QGIS from Sentinel-2 rasters at 10m ground resolution.',
        '• No simulated or synthetic multipliers have been added to the measured 12.53 ha (2023) and 3.03 ha (2026) water boundaries or the 3,705.66 ha (2023) and 3,651.68 ha (2026) vegetation covers.',
      ],
    },
    {
      title: 'B. Prototype Limitations',
      points: [
        '• The multi-temporal comparison observes two specific satellite acquisition timestamps (2023 baseline vs 2026 current). Inter-annual seasonal fluctuations (pre-monsoon vs post-monsoon) require continuous dense time-series compositing.',
        '• Field observations and water body markers currently displayed on the map serve as curated validation points rather than an exhaustive ground-truthing survey of every hydrological structure.',
      ],
    },
    {
      title: 'C. Future & Proposed Features (Roadmap)',
      points: [
        '• Automated imagery ingestion pipeline connecting to Copernicus Open Access Hub for automated cloud-free mosaic generation.',
        '• Machine-learning predictive modeling for seasonal surface runoff estimation and sediment transport risk zones.',
        '• Integration of physical IoT water-level telemetry sensors in check dams and percolation tanks for real-time validation.',
      ],
    },
  ];

  disclosures.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(24, 58, 42);
    doc.text(item.title, margin + 2, y);
    y += 4.2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(45, 45, 45);

    item.points.forEach((pt) => {
      const wrapped = doc.splitTextToSize(pt, contentWidth - 6);
      doc.text(wrapped, margin + 4, y);
      y += wrapped.length * 3.6;
    });

    y += 2.5;
  });

  addFooter(2);

  // Save the generated document
  doc.save('JalDrishti_Geospatial_Analysis_Report.pdf');
};
