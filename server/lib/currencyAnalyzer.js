import { Jimp } from 'jimp';

// Heuristic (non-ML) counterfeit currency screening.
// Real Indian banknotes have known aspect ratios; we compare against those
// plus basic color-histogram and edge-sharpness-variance signals that tend
// to differ between genuine printed notes and photocopies/screen photos.

const EXPECTED_ASPECT_RATIO = { min: 2.05, max: 2.25 }; // typical INR note ratio (length/height)

function traceStep(label, hit, detail) {
  return { step: label, result: detail, hit };
}

async function analyzeImageBuffer(buffer) {
  const trace = [];
  let score = 0;

  const image = await Jimp.read(buffer);
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const ratio = width / height;

  // 1. Aspect ratio check
  const ratioOk = ratio >= EXPECTED_ASPECT_RATIO.min && ratio <= EXPECTED_ASPECT_RATIO.max;
  if (!ratioOk) {
    score += 35;
    trace.push(traceStep('Checking note aspect ratio', true, `${ratio.toFixed(2)} is outside expected 2.05-2.25 range`));
  } else {
    trace.push(traceStep('Checking note aspect ratio', false, `${ratio.toFixed(2)} within expected range`));
  }

  // 2. Color histogram analysis (bucket the hue distribution)
  const buckets = new Array(12).fill(0);
  let rSum = 0, gSum = 0, bSum = 0, pixelCount = 0;
  image.scan(0, 0, width, height, function (x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    rSum += r; gSum += g; bSum += b; pixelCount++;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max !== min) {
      if (max === r) h = ((g - b) / (max - min)) % 6;
      else if (max === g) h = (b - r) / (max - min) + 2;
      else h = (r - g) / (max - min) + 4;
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }
    buckets[Math.floor(h / 30) % 12]++;
  });

  const total = buckets.reduce((a, b) => a + b, 0) || 1;
  const normalized = buckets.map((b) => b / total);
  const maxBucketShare = Math.max(...normalized);
  const histogramFlat = maxBucketShare > 0.75; // overly concentrated / washed-out colors

  if (histogramFlat) {
    score += 25;
    trace.push(traceStep('Checking color histogram distribution', true, `${(maxBucketShare * 100).toFixed(0)}% concentrated in one hue band (unusual)`));
  } else {
    trace.push(traceStep('Checking color histogram distribution', false, 'natural color spread matches genuine note profile'));
  }

  // 3. Edge sharpness variance (Laplacian-like approximation via Sobel gradients)
  const gray = new Float32Array(width * height);
  image.scan(0, 0, width, height, function (x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    gray[y * width + x] = 0.299 * r + 0.587 * g + 0.114 * b;
  });

  const gradients = [];
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const gx = gray[y * width + (x + 1)] - gray[y * width + (x - 1)];
      const gy = gray[(y + 1) * width + x] - gray[(y - 1) * width + x];
      gradients.push(Math.sqrt(gx * gx + gy * gy));
    }
  }
  const mean = gradients.reduce((a, b) => a + b, 0) / (gradients.length || 1);
  const variance = gradients.reduce((a, b) => a + (b - mean) ** 2, 0) / (gradients.length || 1);
  const lowSharpnessVariance = variance < 150; // photocopies/screens tend to blur fine print detail

  if (lowSharpnessVariance) {
    score += 30;
    trace.push(traceStep('Checking edge-sharpness variance', true, `variance ${variance.toFixed(1)} is low, suggesting print/scan artifact`));
  } else {
    trace.push(traceStep('Checking edge-sharpness variance', false, `variance ${variance.toFixed(1)} indicates crisp fine-print detail`));
  }

  // 4. Resolution sanity check
  const lowRes = width < 300 || height < 150;
  if (lowRes) {
    score += 10;
    trace.push(traceStep('Checking image resolution', true, `${width}x${height} is low resolution, reducing analysis confidence`));
  } else {
    trace.push(traceStep('Checking image resolution', false, `${width}x${height} sufficient for analysis`));
  }

  score = Math.min(100, score);
  let verdict = 'safe';
  if (score >= 65) verdict = 'high_risk';
  else if (score >= 30) verdict = 'suspicious';

  const explanation = trace.filter((t) => t.hit).map((t) => `${t.step.replace('Checking ', '')}: ${t.result}`);
  if (explanation.length === 0) {
    explanation.push('All heuristic features within genuine-note thresholds');
  }

  return {
    verdict,
    score,
    trace,
    explanation,
    features: {
      width,
      height,
      aspectRatio: Number(ratio.toFixed(3)),
      maxHueBucketShare: Number(maxBucketShare.toFixed(3)),
      edgeSharpnessVariance: Number(variance.toFixed(1)),
    },
  };
}

export default { analyzeImageBuffer };
