// Academic Integrity & Safety Guard
// Protects SkillBridge from academic dishonesty, fraud, and illicit campus services.

const PROHIBITED_KEYWORDS = [
  'exam cheat',
  'cheat on exam',
  'take my exam',
  'write my exam',
  'take my test',
  'write my test',
  'quiz answer sheet',
  'exam answers leaked',
  'leak exam',
  'fake degree',
  'fake certificate',
  'proxy attendance',
  'attendance proxy',
  'impersonate student',
  'hack university',
  'hack portal',
  'buy exam'
];

export function validateAcademicIntegrity(req, res, next) {
  const { title = '', description = '', message = '' } = req.body;
  const combinedText = `${title} ${description} ${message}`.toLowerCase();

  for (const keyword of PROHIBITED_KEYWORDS) {
    if (combinedText.includes(keyword)) {
      return res.status(400).json({
        error: `Listing rejected: violates campus Academic Integrity Policy (detected prohibited term: "${keyword}"). Tutoring, project collaboration, design, and freelance skills are welcome, but exam fraud, proxy attendance, and cheating are strictly prohibited.`
      });
    }
  }

  next();
}

