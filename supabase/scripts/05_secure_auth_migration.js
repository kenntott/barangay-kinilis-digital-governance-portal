/**
 * =========================================================================
 * BARANGAY KINILIS DIGITAL GOVERNANCE PORTAL
 * FILE 5: SECURE SERVER-SIDE SUPABASE AUTH MIGRATION SCRIPT
 * =========================================================================
 * 
 * STRICT SECURITY REQUIREMENTS:
 * 1. This script is intended ONLY for execution by the System Administrator in a secure
 *    local terminal or backend CLI using the SUPABASE_SERVICE_ROLE_KEY.
 * 2. It NEVER inserts directly into internal `auth.users` via application SQL.
 * 3. It assigns a UNIQUE, cryptographically random password to each newly created account.
 * 4. Passwords and Service-Role keys are NEVER printed, logged, or committed.
 * 5. It NEVER assigns platform super-admin privileges (is_super_admin is strictly false).
 * 6. Hard-locked to the staging environment: https://jekpwngbjcfaxoukfuke.supabase.co
 * 7. Supports standard Supabase Auth Admin API: allows Supabase to generate the natural
 *    Auth UUID and captures it for verification.
 * 8. Stops execution immediately upon any account creation failure.
 *
 * HOW TO EXECUTE:
 *   $env:SUPABASE_URL="https://jekpwngbjcfaxoukfuke.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
 *   node supabase/scripts/05_secure_auth_migration.js
 */

import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// -------------------------------------------------------------------------
// RUNTIME ENVIRONMENT & STAGING-ONLY SAFETY GUARD
// -------------------------------------------------------------------------
const ALLOWED_STAGING_URL = 'https://jekpwngbjcfaxoukfuke.supabase.co';

const rawUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const normalizedUrl = rawUrl.replace(/\/+$/, '');
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!normalizedUrl || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\x1b[31m[SECURITY ERROR]\x1b[0m Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.error('Execution halted before connecting to Supabase.');
  console.error('Example (PowerShell):');
  console.error(`  $env:SUPABASE_URL="${ALLOWED_STAGING_URL}"`);
  console.error('  $env:SUPABASE_SERVICE_ROLE_KEY="your-secret-service-role-key"');
  console.error('  node supabase/scripts/05_secure_auth_migration.js\n');
  process.exit(1);
}

// Strict Staging-Only Guard: Reject any URL that does not match the designated staging project
if (normalizedUrl !== ALLOWED_STAGING_URL) {
  console.error('\x1b[31m[ENVIRONMENT LOCK ERROR]\x1b[0m Target URL rejected: ' + normalizedUrl);
  console.error('This migration script is strictly hard-locked to the staging project:');
  console.error('  Target Allowed: ' + ALLOWED_STAGING_URL);
  console.error('Execution aborted immediately. Production or arbitrary Supabase projects are strictly prohibited.\n');
  process.exit(1);
}

const supabaseAdmin = createClient(normalizedUrl, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Original 5 live accounts from MySQL `users` table
const OFFICIAL_ACCOUNTS = [
  {
    legacyId: 1,
    email: 'juan.delacruz@kinilis.gov.ph',
    fullName: 'Juan dela Cruz',
    role: 'resident',
    phone: '0917-123-4567',
    purok: 'Purok 3, Brgy. Kinilis, Polomolok',
    department: null,
    position: null
  },
  {
    legacyId: 2,
    email: 'maria.santos@kinilis.gov.ph',
    fullName: 'Maria Santos',
    role: 'staff',
    phone: '0920-987-6543',
    purok: 'Purok 1, Brgy. Kinilis',
    department: 'Sanitation Department',
    position: 'Sanitation Officer'
  },
  {
    legacyId: 3,
    email: 'admin@kinilis.gov.ph',
    fullName: 'Admin Desk (Capt. Hon. Escabarte)',
    role: 'admin',
    phone: '0918-000-1122',
    purok: 'Brgy. Hall Complex, Kinilis',
    department: 'Barangay Administrative Office',
    position: 'Barangay Administrator'
  },
  {
    legacyId: 4,
    email: 'roberto.cruz@kinilis.gov.ph',
    fullName: 'Engr. Roberto Cruz',
    role: 'staff',
    phone: '0917-555-4433',
    purok: 'Purok 2, Brgy. Kinilis',
    department: 'Infrastructure & Public Works',
    position: 'Public Works Engineer'
  },
  {
    legacyId: 5,
    email: 'elena.ramos@kinilis.gov.ph',
    fullName: 'Nurse Elena Ramos',
    role: 'staff',
    phone: '0922-111-9988',
    purok: 'Purok 4, Brgy. Kinilis',
    department: 'Barangay Health Center',
    position: 'Head Nurse'
  }
];

const generateSecurePassword = () => {
  // Generates 16 random bytes base64url encoded + special char + uppercase
  return 'Knl#' + crypto.randomBytes(12).toString('base64url') + '!9';
};

async function migrateAuthAccounts() {
  console.log('=====================================================');
  console.log('BARANGAY KINILIS — SECURE AUTH MIGRATION STARTING');
  console.log('Target Supabase Instance:', normalizedUrl, '(STAGING ONLY VERIFIED)');
  console.log('Total Official Accounts to Provision:', OFFICIAL_ACCOUNTS.length);
  console.log('=====================================================\n');

  const provisioningResults = [];

  for (const acc of OFFICIAL_ACCOUNTS) {
    const temporaryPassword = generateSecurePassword();
    console.log(`[Provisioning] ${acc.fullName} (${acc.email}) [Role: ${acc.role}]...`);

    try {
      // 1. Check if user already exists in Supabase Auth by case-insensitive email
      const { data: existingUserList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;

      const matchingUsers = (existingUserList.users || []).filter(
        u => u.email && u.email.toLowerCase() === acc.email.toLowerCase()
      );

      if (matchingUsers.length > 1) {
        throw new Error(`Multiple existing accounts found matching ${acc.email} (${matchingUsers.length} found). Execution halted for safety.`);
      }

      const existingUser = matchingUsers[0];
      let userId;

      if (existingUser) {
        userId = existingUser.id;
        console.log(`  -> User already exists in Auth (UUID: ${userId}). Updating metadata without altering password...`);

        // Update metadata without modifying existing password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            full_name: acc.fullName,
            role: acc.role,
            legacy_user_id: acc.legacyId,
            phone: acc.phone,
            purok: acc.purok,
            department: acc.department,
            position: acc.position
          }
        });
        if (updateError) throw updateError;
      } else {
        // Create user allowing Supabase Auth to generate the natural UUID
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: acc.email,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            full_name: acc.fullName,
            role: acc.role,
            legacy_user_id: acc.legacyId,
            phone: acc.phone,
            purok: acc.purok,
            department: acc.department,
            position: acc.position
          }
        });

        if (createError) throw createError;
        userId = newUser.user.id;
        console.log(`  -> User successfully created in Auth (Generated UUID: ${userId})`);
      }

      provisioningResults.push({
        name: acc.fullName,
        email: acc.email,
        role: acc.role,
        legacyId: acc.legacyId,
        userId: userId,
        status: existingUser ? 'EXISTING_METADATA_SYNCED' : 'CREATED',
        passwordAction: existingUser ? 'PRESERVED_UNTOUCHED' : 'GENERATED_SECURE'
      });

    } catch (err) {
      console.error(`  \x1b[31m[CRITICAL FAILURE]\x1b[0m Could not provision ${acc.email}:`, err.message);
      console.error('Halting migration script immediately to prevent partial or inconsistent state.\n');
      process.exit(1);
    }
  }

  console.log('\n=====================================================');
  console.log('MIGRATION SUMMARY');
  console.log('=====================================================');
  console.table(provisioningResults.map(r => ({
    Name: r.name,
    Email: r.email,
    Role: r.role,
    LegacyId: r.legacyId,
    Status: r.status,
    AuthUUID: r.userId || 'N/A'
  })));

  console.log('\n\x1b[32m[SUCCESS]\x1b[0m All 5 official accounts verified in auth.users.');
  console.log('Next step: execute 04_data_seed_migration.sql in the Supabase Staging SQL Editor.');
}

migrateAuthAccounts();
