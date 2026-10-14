/* ==========================================================================
   MISJ STUCO — CONTENT FILE
   --------------------------------------------------------------------------
   This is the ONLY file most StuCo generations need to edit.
   Every person, department, project, event, number and link on the site is
   generated from the data below. The design adapts automatically.

   QUICK RULES
   • Text: just change the words between the quotes.
   • Images: put the file in /assets/images and write its path, e.g.
       photo: "assets/images/president.jpg"
     Leave it as "" to show the designed placeholder instead.
     Recommended: JPG/WebP, ~1600px wide for big photos, ~900px for portraits.
   • Dates: always "YYYY-MM-DD". Events become UPCOMING / PAST automatically.
   • Adding a department / project / event: copy one block { ... },
     paste it after the last one, add a comma between blocks, edit it.
   • Anything marked SAMPLE is placeholder content — replace before launch.
   ========================================================================== */

window.STUCO_CONTENT = {

  /* ---------- 1. IDENTITY ---------- */
  site: {
    name: "MISJ Student Council",
    short: "StuCo",
    school: "Mentari Intercultural School Jakarta",
    abbreviation: "MISJ",
    term: "2026 — 2027",
    // OFFICIAL MISJ LOGO — replace the placeholder file path with the real logo,
    // e.g. "assets/misj-logo.png". The site never recolours or crops it.
    logo: { src: "assets/logo-placeholder.svg", alt: "Mentari Intercultural School Jakarta logo" },
    // Optional StuCo logo shown in the footer (leave "" to hide)
    stucoLogo: { src: "", alt: "MISJ Student Council logo" }
  },

  /* ---------- 2. CONTACT & SOCIALS ---------- */
  contact: {
    email: "stuco@example.com",                 // SAMPLE — replace with the real StuCo email
    location: "Mentari Intercultural School Jakarta, Jakarta, Indonesia",
    office: "Find us in the StuCo room or talk to any council member."
  },
  socials: [
    // icon can be: instagram, tiktok, youtube, linkedin, email
    { label: "Instagram", icon: "instagram", url: "https://instagram.com/" },   // SAMPLE
    { label: "TikTok",    icon: "tiktok",    url: "https://tiktok.com/" },      // SAMPLE
    { label: "YouTube",   icon: "youtube",   url: "https://youtube.com/" }      // SAMPLE
  ],

  /* ---------- 3. CHAPTER 02 — THE FOUR WORDS ---------- */
  community: [
    { word: "VOICE",      line: "Students deserve to be heard." },
    { word: "LEADERSHIP", line: "Leadership means turning responsibility into action." },
    { word: "COMMUNITY",  line: "The strongest ideas are built together." },
    { word: "ACTION",     line: "Ideas only matter when we do something with them." }
  ],

  /* ---------- 4. LEADERSHIP (CHAPTER 03) ----------
     mark = the big letters shown when there is no photo yet. */
  leadership: [
    { name: "President Name",      role: "President",      department: "Executive Board", mark: "P",  photo: "", quote: "Short editable quote." },
    { name: "Vice President Name", role: "Vice President", department: "Executive Board", mark: "VP", photo: "", quote: "Short editable quote." },
    { name: "Secretary Name",      role: "Secretary",      department: "Executive Board", mark: "S",  photo: "", quote: "Short editable quote." },
    { name: "Treasurer Name",      role: "Treasurer",      department: "Finance and Treasury", mark: "T", photo: "", quote: "Short editable quote." }
  ],

  // General members not listed inside a department (department members are added automatically)
  members: [],

  /* ---------- 5. DEPARTMENTS (CHAPTER 04) ----------
     id      : short unique word, also picks the visual motif
               (events, sports, creative, media, pr, welfare, academics,
                finance, fundraising, environment, responsibility, technology).
               A new department with a new id gets a default motif.
     short   : label used on the network map.                               */
  departments: [
    {
      id: "events", name: "Events and Programs", short: "Events & Programs",
      tagline: "We turn dates into memories.",
      description: "Responsible for planning and executing StuCo programs, school events, activities, and major student experiences.",
      keywords: ["Plan", "Organize", "Experience"],
      mission: "To design experiences that bring the whole MISJ community together — and make every student feel part of the moment.",
      whatWeDo: ["Plan the StuCo event calendar", "Run school-wide events from idea to clean-up", "Coordinate venues, schedules and volunteers", "Collect feedback to make the next event better"],
      head: { name: "Department Head", photo: "", quote: "Short editable quote." },
      members: ["Member Name", "Member Name", "Member Name"],
      stats: [{ value: 12, suffix: "+", label: "Events run" }, { value: 600, suffix: "+", label: "Attendees" }],   // SAMPLE
      image: "", gallery: ["", "", ""]
    },
    {
      id: "sports", name: "Sports and Competition", short: "Sports & Competition",
      tagline: "We play for each other.",
      description: "Responsible for sports activities, competitions, tournaments, and initiatives that encourage participation, teamwork, and school spirit.",
      keywords: ["Compete", "Teamwork", "Spirit"],
      mission: "To make competition a reason to come together — where every student can play, cheer and belong.",
      whatWeDo: ["Organize inter-house tournaments", "Run Sports Day with the PE team", "Encourage participation beyond the varsity teams", "Celebrate school spirit"],
      head: { name: "Department Head", photo: "", quote: "Short editable quote." },
      members: ["Member Name", "Member Name", "Member Name"],
      stats: [{ value: 6, suffix: "", label: "Tournaments" }, { value: 300, suffix: "+", label: "Athletes" }],
      image: "", gallery: ["", "", ""]
    },
    {
      id: "creative", name: "Creative", short: "Creative",
      tagline: "We give ideas a shape.",
      description: "Responsible for creative concepts, visual ideas, design, campaigns, and the artistic identity of StuCo.",
      keywords: ["Imagine", "Create", "Inspire"],
      mission: "To give every StuCo idea a look, a feeling and a story that students remember.",
      whatWeDo: ["Design posters, campaigns and merchandise", "Shape the visual identity of StuCo", "Art-direct events and decorations", "Support other departments with creative concepts"],
      head: { name: "Department Head", photo: "", quote: "Short editable quote." },
      members: ["Member Name", "Member Name", "Member Name"],
      stats: [{ value: 40, suffix: "+", label: "Designs made" }, { value: 5, suffix: "", label: "Campaigns" }],
      image: "", gallery: ["", "", ""]
    },
    {
      id: "media", name: "Media and Documentation", short: "Media & Documentation",
      tagline: "We keep the moments.",
      description: "Responsible for photography, videography, content creation, documentation, and preserving StuCo memories.",
      keywords: ["Capture", "Create", "Remember"],
      mission: "To capture the journey honestly and beautifully, so every generation can look back and build forward.",
      whatWeDo: ["Photograph and film every StuCo moment", "Produce recap videos and social content", "Build the StuCo photo archive", "Tell students' stories"],
      head: { name: "Department Head", photo: "", quote: "Short editable quote." },
      members: ["Member Name", "Member Name", "Member Name"],
      stats: [{ value: 2000, suffix: "+", label: "Photos taken" }, { value: 15, suffix: "", label: "Videos" }],
      image: "", gallery: ["", "", ""]
    },
    {
      id: "pr", name: "Public Relations and Student Engagement", short: "PR & Engagement",
      tagline: "We make sure every voice arrives.",
      description: "Connects StuCo with students and the wider MISJ community. Responsible for communication, outreach, engagement, announcements, and making sure students stay informed and involved.",
      keywords: ["Connect", "Communicate", "Engage"],
      mission: "To keep a clear, open line between StuCo and every student — so nobody misses out and everyone can speak up.",
      whatWeDo: ["Write and share StuCo announcements", "Run surveys and town halls", "Manage StuCo social media", "Build bridges with clubs, teachers and parents"],
      head: { name: "Department Head", photo: "", quote: "Short editable quote." },
      members: ["Member Name", "Member Name", "Member Name"],
      stats: [{ value: 4, suffix: "", label: "Town halls" }, { value: 500, suffix: "+", label: "Survey replies" }],
      image: "", gallery: ["", "", ""]
    },
    {
      id: "welfare", name: "Student Welfare", short: "Student Welfare",
      tagline: "We listen first.",
      description: "Focuses on student needs, concerns, experiences, and initiatives that improve student life at MISJ.",
      keywords: ["Listen", "Support", "Care"],
      mission: "To make MISJ a place where every student feels safe, supported and genuinely cared for.",
      whatWeDo: ["Collect and follow up on student concerns", "Run wellbeing initiatives", "Improve everyday student spaces", "Work with counsellors on student support"],
      head: { name: "Department Head", photo: "", quote: "Short editable quote." },
      members: ["Member Name", "Member Name", "Member Name"],
      stats: [{ value: 30, suffix: "+", label: "Concerns resolved" }, { value: 3, suffix: "", label: "Wellbeing weeks" }],
      image: "", gallery: ["", "", ""]
    },
    {
      id: "academics", name: "Academics", short: "Academics",
      tagline: "We make learning shared.",
      description: "Supports academic initiatives and encourages students to engage with learning, academic opportunities, and educational activities.",
      keywords: ["Learn", "Grow", "Excel"],
      mission: "To make learning something students do together — curious, ambitious and never alone.",
      whatWeDo: ["Run peer tutoring and study circles", "Share academic opportunities and competitions", "Organize exam-season support", "Celebrate academic achievement"],
      head: { name: "Department Head", photo: "", quote: "Short editable quote." },
      members: ["Member Name", "Member Name", "Member Name"],
      stats: [{ value: 25, suffix: "", label: "Study sessions" }, { value: 150, suffix: "+", label: "Students helped" }],
      image: "", gallery: ["", "", ""]
    },
    {
      id: "finance", name: "Finance and Treasury", short: "Finance & Treasury",
      tagline: "We make every rupiah count.",
      description: "Responsible for managing StuCo finances, budgeting, financial planning, and responsible use of resources.",
      keywords: ["Plan", "Manage", "Sustain"],
      mission: "To manage StuCo's resources with honesty and care, so good ideas are never stopped by poor planning.",
      whatWeDo: ["Build and track the StuCo budget", "Approve and record spending", "Report finances transparently", "Plan for long-term sustainability"],
      head: { name: "Department Head", photo: "", quote: "Short editable quote." },
      members: ["Member Name", "Member Name"],
      stats: [{ value: 100, suffix: "%", label: "Spending reported" }, { value: 12, suffix: "", label: "Budgets planned" }],
      image: "", gallery: ["", "", ""]
    },
    {
      id: "fundraising", name: "Fundraising and Sponsorship", short: "Fundraising & Sponsorship",
      tagline: "We find the way to make it real.",
      description: "Responsible for fundraising initiatives, sponsorships, partnerships, and finding resources that allow StuCo projects to become reality.",
      keywords: ["Connect", "Fund", "Build"],
      mission: "To find the people, partners and resources that turn student ideas into real projects.",
      whatWeDo: ["Plan fundraising events and sales", "Find and look after sponsors", "Build partnerships with local businesses", "Support charity initiatives"],
      head: { name: "Department Head", photo: "", quote: "Short editable quote." },
      members: ["Member Name", "Member Name", "Member Name"],
      stats: [{ value: 5, suffix: "", label: "Partners" }, { value: 8, suffix: "", label: "Fundraisers" }],
      image: "", gallery: ["", "", ""]
    },
    {
      id: "environment", name: "Environment and Social Service", short: "Environment & Service",
      tagline: "We care beyond the gates.",
      description: "Creates initiatives focused on environmental responsibility, social service, community contribution, and positive impact beyond the school.",
      keywords: ["Care", "Serve", "Impact"],
      mission: "To make MISJ a positive force for the planet and for the communities around us.",
      whatWeDo: ["Run sustainability campaigns", "Organize service projects", "Reduce waste around campus", "Partner with community organisations"],
      head: { name: "Department Head", photo: "", quote: "Short editable quote." },
      members: ["Member Name", "Member Name", "Member Name"],
      stats: [{ value: 200, suffix: "kg", label: "Waste diverted" }, { value: 6, suffix: "", label: "Service days" }],
      image: "", gallery: ["", "", ""]
    },
    {
      id: "responsibility", name: "Student Responsibility and Discipline", short: "Responsibility & Discipline",
      tagline: "We set the standard together.",
      description: "Promotes responsibility, accountability, positive behavior, and a respectful school environment.",
      keywords: ["Responsibility", "Respect", "Lead"],
      mission: "To build a culture of respect and accountability that students choose — not one that is forced on them.",
      whatWeDo: ["Promote the student code of conduct", "Recognise positive behaviour", "Support fair and respectful processes", "Lead by example"],
      head: { name: "Department Head", photo: "", quote: "Short editable quote." },
      members: ["Member Name", "Member Name"],
      stats: [{ value: 1, suffix: "", label: "Respect charter" }, { value: 50, suffix: "+", label: "Students recognised" }],
      image: "", gallery: ["", "", ""]
    },
    {
      id: "technology", name: "Technology and Innovation", short: "Tech & Innovation",
      tagline: "We build what comes next.",
      description: "Responsible for technology, digital systems, innovation, and finding new ways to improve StuCo and student experiences.",
      keywords: ["Innovate", "Build", "Future"],
      mission: "To build the digital tools and new ideas that make StuCo faster, fairer and more open to every student.",
      whatWeDo: ["Build and maintain the StuCo website", "Run digital forms, voting and feedback systems", "Explore new tools for student life", "Support every department with technology"],
      head: { name: "Department Head", photo: "", quote: "Short editable quote." },
      members: ["Member Name", "Member Name", "Member Name"],
      stats: [{ value: 3, suffix: "", label: "Systems built" }, { value: 1, suffix: "", label: "Website" }],
      image: "", gallery: ["", "", ""]
    }
  ],

  /* ---------- 6. PROJECTS (CHAPTER 06) ----------
     department = the department id. status: "Completed", "Ongoing", "Planned".
     link (optional) = a URL for more information.                           */
  projectFilters: [
    { label: "All" },
    { label: "Events",     departments: ["events"] },
    { label: "Sports",     departments: ["sports"] },
    { label: "Creative",   departments: ["creative"] },
    { label: "Media",      departments: ["media"] },
    { label: "Academics",  departments: ["academics"] },
    { label: "Community",  departments: ["pr", "welfare", "finance", "fundraising", "environment", "responsibility"] },
    { label: "Technology", departments: ["technology"] }
  ],
  projects: [   // SAMPLE projects — replace with real ones
    { title: "Welcome Week",            department: "events",         year: 2026, status: "Completed", image: "", description: "Five days that turned a new school year into a shared beginning." },
    { title: "Inter-House Futsal Cup",  department: "sports",         year: 2026, status: "Ongoing",   image: "", description: "A season-long league where every grade plays, cheers and competes." },
    { title: "The StuCo Identity",      department: "creative",       year: 2026, status: "Completed", image: "", description: "A visual language for the council — from posters to this website." },
    { title: "One Year in Frames",      department: "media",          year: 2026, status: "Ongoing",   image: "", description: "A documentary of the school year, told through students' eyes." },
    { title: "Student Town Hall",       department: "pr",             year: 2026, status: "Completed", image: "", description: "An open floor where any student can question, suggest and be heard." },
    { title: "Quiet Corners",           department: "welfare",        year: 2026, status: "Planned",   image: "", description: "Calm spaces on campus for students who need a moment to breathe." },
    { title: "Peer Study Circles",      department: "academics",      year: 2026, status: "Ongoing",   image: "", description: "Students teaching students before every major assessment." },
    { title: "Open Budget Board",       department: "finance",        year: 2026, status: "Ongoing",   image: "", description: "A transparent view of how StuCo plans and spends its resources." },
    { title: "Bazaar for Good",         department: "fundraising",    year: 2026, status: "Planned",   image: "", description: "A student-run bazaar where every sale supports a cause." },
    { title: "Zero-Waste Canteen",      department: "environment",    year: 2026, status: "Ongoing",   image: "", description: "Reducing single-use waste, one lunch break at a time." },
    { title: "Respect Charter",         department: "responsibility", year: 2026, status: "Completed", image: "", description: "A code of conduct written by students, for students." },
    { title: "StuCo Digital Hub",       department: "technology",     year: 2026, status: "Ongoing",   image: "", description: "The digital home of the journey — the site you are exploring now." }
  ],

  /* ---------- 7. EVENTS (CHAPTER 07) ----------
     date: "YYYY-MM-DD" (endDate optional). Status is automatic.               */
  events: [   // SAMPLE events — replace with real ones
    { title: "Welcome Back Assembly",          date: "2026-08-10", location: "Main Hall",        department: "events",      image: "", description: "The first gathering of the year — new faces, new council, new chapter." },
    { title: "17 Agustus Celebration",         date: "2026-08-17", location: "School Field",     department: "events",      image: "", description: "Celebrating Indonesian Independence Day with games, pride and school spirit." },
    { title: "Inter-House Sports Day",         date: "2026-09-18", location: "Sports Complex",   department: "sports",      image: "", description: "A full day of races, relays and loud, proud house colours." },
    { title: "StuCo Town Hall",                date: "2026-10-02", location: "Auditorium",       department: "pr",          image: "", description: "Students asked the hard questions. StuCo listened — and answered." },
    { title: "Spirit Week",                    date: "2026-10-26", endDate: "2026-10-30", location: "Whole Campus", department: "events", image: "", description: "Five themed days. One school, louder than ever." },
    { title: "Bazaar for Good",                date: "2026-11-21", location: "Courtyard",        department: "fundraising", image: "", description: "Student-run stalls, live music and every rupiah going to a cause." },
    { title: "Peer Study Marathon",            date: "2026-11-28", location: "Library",          department: "academics",   image: "", description: "A full day of student-led revision before the end-of-semester exams." },
    { title: "Year-End Showcase",              date: "2026-12-11", location: "Main Hall",        department: "creative",    image: "", description: "The work, the stories and the people of the semester — on one stage." }
  ],

  /* ---------- 8. IMPACT NUMBERS (CHAPTER 08) ---------- */
  impact: [   // SAMPLE numbers — replace with real ones
    { value: 24,  suffix: "+", label: "Events" },
    { value: 850, suffix: "+", label: "Students reached" },
    { value: 18,  suffix: "+", label: "Projects" },
    { value: 120, suffix: "+", label: "Ideas" },
    { value: 60,  suffix: "+", label: "Activities" }
  ],

  /* ---------- 9. STUDENT VOICE ----------
     url: a Google Form (or other approved platform) link.
     Leave "" and the button will open an email to contact.email instead.    */
  voice: [
    { title: "Submit an idea",  text: "Big or small — every change starts with one idea.", url: "" },
    { title: "Give feedback",   text: "Tell us what works, what doesn't, and what's missing.", url: "" },
    { title: "Start something", text: "Have a project in mind? Let's build it together.",  url: "" }
  ],

  /* ---------- 10. THE FUTURE — milestones on the final line ---------- */
  milestones: ["Ideas", "Leadership", "People", "Departments", "Projects", "Events", "Impact"],

  /* ---------- 11. MENU ---------- */
  menu: [
    { label: "Home",        href: "#top" },
    { label: "Journey",     href: "#beginning" },
    { label: "Departments", href: "#departments" },
    { label: "Projects",    href: "#projects" },
    { label: "Events",      href: "#events" },
    { label: "Team",        href: "#people" },
    { label: "Impact",      href: "#impact" },
    { label: "Play",        href: "#game" },
    { label: "Contact",     href: "#contact" }
  ]
};
