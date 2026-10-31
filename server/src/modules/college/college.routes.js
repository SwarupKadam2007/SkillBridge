import { Router } from 'express';
import { supabaseAdmin } from '../../config/supabase.js';

const router = Router();

// Returns list of supported active campuses and their domains
router.get('/active', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('colleges')
      .select('id, name, slug, college_domains(domain)')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    res.json({ colleges: data });
  } catch (e) {
    next(e);
  }
});

// Verifies email domain against an admin-maintained allowlist.
router.post('/verify', async (req, res, next) => {
  try {
    const email = (req.user.email || '').toLowerCase().trim();
    const domain = email.split('@')[1];
    if (!domain) {
      return res.status(400).json({ error: 'Account email has no valid domain' });
    }

    // Check exact domain or root domain (e.g., student.stanford.edu -> stanford.edu)
    const domainParts = domain.split('.');
    const candidateDomains = [domain];
    if (domainParts.length > 2) {
      candidateDomains.push(domainParts.slice(-2).join('.'));
    }

    const { data: match, error: lookupError } = await supabaseAdmin
      .from('college_domains')
      .select('college_id, colleges(id, name, is_active)')
      .in('domain', candidateDomains)
      .eq('is_active', true)
      .order('domain', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!match || !match.colleges?.is_active) {
      return res.status(403).json({
        error: `The email domain "@${domain}" is not registered for an active SkillBridge campus. Please sign in with your official college email.`
      });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        college_id: match.college_id,
        college_verified_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select('id, full_name, college_id, college_verified_at')
      .single();

    if (error) throw error;
    res.json({
      message: `Verified successfully for ${match.colleges.name}!`,
      profile: data,
      college: match.colleges
    });
  } catch (e) {
    next(e);
  }
});

export default router;
