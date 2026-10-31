import AsyncStorage from '@react-native-async-storage/async-storage';

export const INITIAL_USER = {
  id: 'usr_alex_001',
  email: 'alex.rivera@stanford.edu',
  full_name: 'Alex Rivera',
  bio: 'CS Junior @ Stanford. Experienced in React Native, Python & UI design. Happy to help campus peers with projects and tutoring!',
  course: 'B.S. Computer Science',
  graduation_year: 2026,
  college_id: 'col_stanford_01',
  college_verified_at: '2026-09-01T12:00:00.000Z',
  colleges: {
    id: 'col_stanford_01',
    name: 'Stanford University',
    domain: 'stanford.edu'
  }
};

export const INITIAL_GIGS = [
  {
    id: 'gig_001',
    title: 'React Native & Expo App Debugging',
    description: 'Stuck on React Native navigation, Gradle builds, state management, or Expo camera/location APIs? I have 2+ years of mobile app dev experience and will sit down with you to review and fix code bugs.',
    category: 'Coding',
    price_paise: 150000,
    delivery_days: 2,
    status: 'open',
    seller_id: 'usr_maya_002',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    profiles: {
      id: 'usr_maya_002',
      full_name: 'Maya Chen',
      course: 'B.S. Computer Science',
      graduation_year: 2025,
      bio: 'Mobile dev enthusiast, senior CS student, built 4 production apps.'
    }
  },
  {
    id: 'gig_002',
    title: 'Calculus II & Linear Algebra 1-on-1 Prep',
    description: 'Struggling with integration techniques, Taylor series, or matrix eigenvalues? 1-on-1 tutoring sessions with curated practice problems and cheat sheets for midterms and finals.',
    category: 'Notes & Tutoring',
    price_paise: 80000,
    delivery_days: 1,
    status: 'open',
    seller_id: 'usr_david_003',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    profiles: {
      id: 'usr_david_003',
      full_name: 'David Kim',
      course: 'B.S. Mathematics',
      graduation_year: 2025,
      bio: 'Math TA, Dean’s list. Love breaking down complex concepts simply.'
    }
  },
  {
    id: 'gig_003',
    title: 'Campus Club Event Branding & Poster Kit',
    description: 'Need striking visuals for your campus organization, hackathon, or cultural fest? Includes Instagram story templates, high-res printable posters, and vector logos created in Figma/Illustrator.',
    category: 'Design',
    price_paise: 120000,
    delivery_days: 2,
    status: 'open',
    seller_id: 'usr_sarah_004',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    profiles: {
      id: 'usr_sarah_004',
      full_name: 'Sarah Jenkins',
      course: 'B.Des Product Design',
      graduation_year: 2025,
      bio: 'Freelance UI/UX and graphic designer. Campus arts director.'
    }
  },
  {
    id: 'gig_004',
    title: 'SWE & Product Resume Line-by-Line Review',
    description: 'Incoming Google SWE intern reviewing your resume. Detailed bullet point critique, action-verb restructuring, ATS optimization, and 30-min strategy for FAANG campus recruiting.',
    category: 'Writing',
    price_paise: 95000,
    delivery_days: 1,
    status: 'open',
    seller_id: 'usr_priya_005',
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
    profiles: {
      id: 'usr_priya_005',
      full_name: 'Priya Patel',
      course: 'M.S. Computer Science',
      graduation_year: 2024,
      bio: 'Received offers from Google, Stripe, and Microsoft.'
    }
  },
  {
    id: 'gig_005',
    title: 'Dorm Moving & Storage Loading Help',
    description: 'Have a pickup truck and muscle. Happy to help transfer boxes, monitors, and dorm furniture across campus or to summer storage lockers.',
    category: 'Errands',
    price_paise: 60000,
    delivery_days: 1,
    status: 'open',
    seller_id: 'usr_marcus_006',
    created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
    profiles: {
      id: 'usr_marcus_006',
      full_name: 'Marcus Lee',
      course: 'B.S. Mechanical Eng',
      graduation_year: 2026,
      bio: 'Campus athlete and truck owner. Fast and careful mover.'
    }
  },
  {
    id: 'gig_006',
    title: 'Campus & Graduation Portrait Photography',
    description: 'Professional 45-minute outdoor portrait photoshoot with Sony A7IV and 85mm f/1.4 lens. Includes 20 color-graded, high-res photos suitable for LinkedIn and grad announcements.',
    category: 'Events',
    price_paise: 250000,
    delivery_days: 3,
    status: 'open',
    seller_id: 'usr_jordan_007',
    created_at: new Date(Date.now() - 3600000 * 150).toISOString(),
    profiles: {
      id: 'usr_jordan_007',
      full_name: 'Jordan Taylor',
      course: 'B.A. Film & Media',
      graduation_year: 2025,
      bio: 'Published photographer, campus event media coordinator.'
    }
  },
  {
    id: 'gig_007',
    title: 'Python Web Scraping & Data Cleaning Script',
    description: 'Custom Python scripts using Beautiful Soup, Playwright, or Pandas to clean messy datasets, scrape research papers, or automate repetitive web tasks for your lab assignments.',
    category: 'Coding',
    price_paise: 140000,
    delivery_days: 2,
    status: 'open',
    seller_id: 'usr_alex_001', // Posted by current user
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    profiles: {
      id: 'usr_alex_001',
      full_name: 'Alex Rivera',
      course: 'B.S. Computer Science',
      graduation_year: 2026,
      bio: 'CS Junior @ Stanford.'
    }
  }
];

export const INITIAL_ORDERS = [
  {
    id: 'ord_demo_001',
    gig_id: 'gig_003',
    buyer_id: 'usr_alex_001',
    seller_id: 'usr_sarah_004',
    agreed_price_paise: 120000,
    status: 'delivered',
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    gigs: {
      id: 'gig_003',
      title: 'Campus Club Event Branding & Poster Kit',
      category: 'Design'
    },
    seller: {
      id: 'usr_sarah_004',
      full_name: 'Sarah Jenkins',
      course: 'B.Des Product Design'
    },
    buyer: {
      id: 'usr_alex_001',
      full_name: 'Alex Rivera'
    },
    deliveries: [
      {
        id: 'del_001',
        note: 'Completed all 3 poster variants + IG story templates in Figma. Exported high-res PNG and vector PDF for printing.',
        file_path: 'https://figma.com/file/demo-campus-event-kit',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ]
  },
  {
    id: 'ord_demo_002',
    gig_id: 'gig_007',
    buyer_id: 'usr_david_003',
    seller_id: 'usr_alex_001',
    agreed_price_paise: 140000,
    status: 'in_progress',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    gigs: {
      id: 'gig_007',
      title: 'Python Web Scraping & Data Cleaning Script',
      category: 'Coding'
    },
    seller: {
      id: 'usr_alex_001',
      full_name: 'Alex Rivera'
    },
    buyer: {
      id: 'usr_david_003',
      full_name: 'David Kim',
      course: 'B.S. Mathematics'
    },
    deliveries: []
  },
  {
    id: 'ord_demo_003',
    gig_id: 'gig_002',
    buyer_id: 'usr_alex_001',
    seller_id: 'usr_david_003',
    agreed_price_paise: 80000,
    status: 'accepted',
    created_at: new Date(Date.now() - 3600000 * 70).toISOString(),
    gigs: {
      id: 'gig_002',
      title: 'Calculus II & Linear Algebra 1-on-1 Prep',
      category: 'Notes & Tutoring'
    },
    seller: {
      id: 'usr_david_003',
      full_name: 'David Kim'
    },
    buyer: {
      id: 'usr_alex_001',
      full_name: 'Alex Rivera'
    },
    deliveries: [
      {
        id: 'del_002',
        note: 'Completed 2-hour tutoring session at Green Library + sent formula sheets.',
        file_path: 'https://drive.google.com/demo-calc-notes.pdf',
        created_at: new Date(Date.now() - 3600000 * 60).toISOString()
      }
    ]
  }
];

export const INITIAL_CONVERSATIONS = [
  {
    id: 'conv_demo_001',
    gig_id: 'gig_001',
    buyer_id: 'usr_alex_001',
    seller_id: 'usr_maya_002',
    otherUser: {
      id: 'usr_maya_002',
      full_name: 'Maya Chen',
      course: 'B.S. Computer Science'
    },
    gigs: {
      id: 'gig_001',
      title: 'React Native & Expo App Debugging'
    },
    latestMessage: {
      body: 'Awesome! Let’s review the React Navigation stack and fix that Android build issue.',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    }
  },
  {
    id: 'conv_demo_002',
    gig_id: 'gig_003',
    buyer_id: 'usr_alex_001',
    seller_id: 'usr_sarah_004',
    otherUser: {
      id: 'usr_sarah_004',
      full_name: 'Sarah Jenkins',
      course: 'B.Des Product Design'
    },
    gigs: {
      id: 'gig_003',
      title: 'Campus Club Event Branding & Poster Kit'
    },
    latestMessage: {
      body: 'I just uploaded the Figma link in the delivery section! Let me know what you think.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
    }
  }
];

export const INITIAL_MESSAGES = {
  conv_demo_001: [
    {
      id: 'msg_001',
      conversation_id: 'conv_demo_001',
      sender_id: 'usr_alex_001',
      body: 'Hey Maya! Are you available to help debug an Expo React Native navigation stack?',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      id: 'msg_002',
      conversation_id: 'conv_demo_001',
      sender_id: 'usr_maya_002',
      body: 'Hey Alex! Yes definitely, I’ve worked on multiple Expo native builds.',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    },
    {
      id: 'msg_003',
      conversation_id: 'conv_demo_001',
      sender_id: 'usr_maya_002',
      body: 'Awesome! Let’s review the React Navigation stack and fix that Android build issue.',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    }
  ],
  conv_demo_002: [
    {
      id: 'msg_101',
      conversation_id: 'conv_demo_002',
      sender_id: 'usr_sarah_004',
      body: 'Hi Alex, what color palette would you prefer for the club poster?',
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    },
    {
      id: 'msg_102',
      conversation_id: 'conv_demo_002',
      sender_id: 'usr_alex_001',
      body: 'Deep purple (#7C3AED) with clean typography and modern campus vibe!',
      created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString()
    },
    {
      id: 'msg_103',
      conversation_id: 'conv_demo_002',
      sender_id: 'usr_sarah_004',
      body: 'I just uploaded the Figma link in the delivery section! Let me know what you think.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
    }
  ]
};

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_001',
    title: '📦 Delivery Submitted',
    body: 'Sarah Jenkins submitted the delivery for Order #ORD-DEMO-001. Review work and release escrow funds.',
    read_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'notif_002',
    title: '🛡️ Escrow Payment Locked',
    body: '₹1,400 has been securely funded into SkillBridge Escrow for your Python Web Scraping gig.',
    read_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: 'notif_003',
    title: '⭐ New 5-Star Review',
    body: 'David Kim left a 5-star review: "Very knowledgeable and patient tutor. A+ experience!"',
    read_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString()
  }
];

export const INITIAL_COLLEGES = [
  {
    id: 'col_stanford_01',
    name: 'Stanford University',
    college_domains: [{ domain: 'stanford.edu' }]
  },
  {
    id: 'col_mit_02',
    name: 'Massachusetts Institute of Technology (MIT)',
    college_domains: [{ domain: 'mit.edu' }]
  },
  {
    id: 'col_berkeley_03',
    name: 'UC Berkeley',
    college_domains: [{ domain: 'berkeley.edu' }]
  },
  {
    id: 'col_harvard_04',
    name: 'Harvard University',
    college_domains: [{ domain: 'harvard.edu' }]
  },
  {
    id: 'col_iitb_05',
    name: 'IIT Bombay',
    college_domains: [{ domain: 'iitb.ac.in' }]
  },
  {
    id: 'col_demo_06',
    name: 'SkillBridge Demo Campus',
    college_domains: [{ domain: 'student.edu' }, { domain: 'college.edu' }, { domain: 'gmail.com' }]
  }
];

export const INITIAL_APPLICATIONS = [
  {
    id: 'app_demo_001',
    gig_id: 'gig_001',
    applicant_id: 'usr_alex_001',
    status: 'accepted',
    message: 'I have extensive experience with React Native, Expo, and Gradle build debugging. Ready to resolve your issue today.',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    gigs: {
      id: 'gig_001',
      title: 'React Native & Expo App Debugging',
      price_paise: 150000
    }
  }
];

export const INITIAL_REPUTATION = {
  averageRating: 4.9,
  totalReviews: 12,
  reviews: [
    {
      id: 'rev_001',
      rating: 5,
      comment: 'Super fast turnaround and great communication. Helped solve our navigation crash right away.',
      reviewer: { full_name: 'Maya Chen' }
    },
    {
      id: 'rev_002',
      rating: 5,
      comment: 'Excellent tutor and mentor! Helped me ace my Calculus midterm.',
      reviewer: { full_name: 'David Kim' }
    },
    {
      id: 'rev_003',
      rating: 5,
      comment: 'Very professional, clean code and great documentation.',
      reviewer: { full_name: 'Marcus Lee' }
    }
  ]
};

