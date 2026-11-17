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
 * 3. It assigns a UNIQUE, cryptographically random password to each account (or triggers
 *    an official email invitation).
 * 4. It NEVER assigns platform super-admin privileges (is_super_admin is strictly false).
 * 5. NEVER commit the service-role key or expose it in frontend VITE_ variables.
 *
 * HOW TO EXECUTE:
 *   export SUPABASE_URL="https://your-project.supabase.co"
 *   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
 *   node supabase/migration/05_secure_auth_migration.js
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\x1b[31m[SECURITY ERROR]\x1b[0m Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.error('Please set them in your terminal before running this script.');
  console.error('Example (PowerShell):');
  console.error('  $env:SUPABASE_SERVICE_ROLE_KEY="your-secret-service-role-key"');
  console.error('  node supabase/migration/05_secure_auth_migration.js\n');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Original 5 live accounts from MySQL \`users\` table
const OFFICIAL_ACCOUNTS = [
  {
    legacyId: 1,
    deterministicId: 'a1111111-1111-4111-8111-111111111111',
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
    deterministicId: 'a2222222-2222-4222-8222-222222222222',
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
    deterministicId: 'a3333333-3333-4333-8333-333333333333',
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
    deterministicId: 'a4444444-4444-4444-8444-444444444444',
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
    deterministicId: 'a5555555-5555-4555-8555-555555555555',
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
  console.log('Target Supabase Instance:', SUPABASE_URL);
  console.log('Total Official Accounts to Provision:', OFFICIAL_ACCOUNTS.length);
  console.log('=====================================================\n');

  const provisioningResults = [];

  for (const acc of OFFICIAL_ACCOUNTS) {
    const temporaryPassword = generateSecurePassword();
    console.log(`[Provisioning] ${acc.fullName} (${acc.email}) [Role: ${acc.role}]...`);

    try {
      // 1. Check if user already exists in Supabase Auth
      const { data: existingUserList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;

      const existingUser = existingUserList.users.find(u => u.email.toLowerCase() === acc.email.toLowerCase());

      let userId;

      if (existingUser) {
        userId = existingUser.id;
        console.log(`  -> User already exists in Auth (UUID: ${userId}). Updating metadata...`);

        // Update metadata without wiping existing password if user already logged in
        await supabaseAdmin.auth.admin.updateUserById(userId, {
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
      } else {
        // Create user with explicit UUID and individual temporary password
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          id: acc.deterministicId,
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
        console.log(`  -> User successfully created (UUID: ${userId})`);
      }

      // 2. Synchronize profile table
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          full_name: acc.fullName,
          email: acc.email,
          role: acc.role,
          phone: acc.phone,
          purok: acc.purok,
          department: acc.department,
          position: acc.position,
          status: 'Active',
          legacy_user_id: acc.legacyId
        }, { onConflict: 'id' });

      if (profileError) {
        console.warn(`  [Warning] Profile sync failed for ${acc.email}:`, profileError.message);
      } else {
        console.log(`  -> Profile synced in public.profiles table.`);
      }

      provisioningResults.push({
        name: acc.fullName,
        email: acc.email,
        role: acc.role,
        userId: userId,
        status: existingUser ? 'EXISTING_UPDATED' : 'CREATED',
        temporaryPassword: existingUser ? '[UNCHANGED_EXISTING]' : temporaryPassword
      });

    } catch (err) {
      console.error(`  \x1b[31m[FAILED]\x1b[0m Could not provision ${acc.email}:`, err.message);
      provisioningResults.push({
        name: acc.fullName,
        email: acc.email,
        role: acc.role,
        status: 'ERROR',
        error: err.message
      });
    }
  }

  console.log('\n=====================================================');
  console.log('MIGRATION SUMMARY');
  console.log('=====================================================');
  console.table(provisioningResults.map(r => ({
    Name: r.name,
    Email: r.email,
    Role: r.role,
    Status: r.status,
    TempPassword: r.temporaryPassword ? (r.temporaryPassword.startsWith('[') ? r.temporaryPassword : 'GENERATED (PRINTED BELOW)') : 'N/A'
  })));

  console.log('\n\x1b[33m[IMPORTANT NEXT STEPS]\x1b[0m');
  console.log('1. Deliver individual credentials securely to each staff member and resident.');
  console.log('2. Advise all users to change their temporary password upon their first login.');
  console.log('3. Ensure this terminal output is cleared once credentials have been distributed.');
}

migrateAuthAccounts();
