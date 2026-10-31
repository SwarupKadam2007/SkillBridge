import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in server/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const apkPath = path.resolve('./SkillBridge.apk');
if (!fs.existsSync(apkPath)) {
  console.error(`\n❌ Error: Could not find ${apkPath}. Please place your SkillBridge.apk in the root folder before uploading.`);
  process.exit(1);
}

async function uploadApk() {
  const bucketName = 'app-releases';

  console.log(`\n⏳ Checking/creating public bucket "${bucketName}" on Supabase...`);
  
  // 1. Ensure bucket exists and is public
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = (buckets || []).some((b) => b.name === bucketName);

  if (!bucketExists) {
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['application/vnd.android.package-archive', 'application/octet-stream']
    });
    if (createError) {
      console.warn('Warning creating bucket:', createError.message);
    }
  }

  // 2. Read APK binary file
  console.log(`⏳ Uploading SkillBridge.apk (${(fs.statSync(apkPath).size / (1024 * 1024)).toFixed(1)} MB)...`);
  const fileBuffer = fs.readFileSync(apkPath);

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload('SkillBridge.apk', fileBuffer, {
      contentType: 'application/vnd.android.package-archive',
      upsert: true
    });

  if (uploadError) {
    console.error('❌ Upload failed:', uploadError.message);
    process.exit(1);
  }

  // 3. Get Public URL
  const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl('SkillBridge.apk');

  console.log(`\n========================================================================`);
  console.log(`🎉 PERMANENT DOWNLOAD LINK CREATED!`);
  console.log(`========================================================================`);
  console.log(`\n👉 Anyone in the world can download the app at any time using this link:`);
  console.log(`\n   ${publicUrl}\n`);
  console.log(`========================================================================\n`);
}

uploadApk().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

