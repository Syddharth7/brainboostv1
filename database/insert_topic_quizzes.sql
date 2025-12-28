-- STEP 1: First run the migration script (migration_topic_quizzes.sql)

-- STEP 2: Get your topic IDs by running this query:
-- SELECT id, title, "order" FROM public.topics WHERE lesson_id = '2168e84c-dc22-44d5-b0d3-d31727155fdf' ORDER BY "order";

-- STEP 3: Replace the topic IDs below with the actual UUIDs from step 2, then run this script

-- Insert 5 Quizzes (one per topic) - REPLACE TOPIC IDs WITH ACTUAL VALUES
INSERT INTO public.quizzes (id, topic_id, title, passing_score, created_at) VALUES
('a1111111-1111-1111-1111-111111111111', 'REPLACE_WITH_TOPIC_1_UUID', 'Computer Hardware Fundamentals Quiz', 70, now()),
('a2222222-2222-2222-2222-222222222222', 'REPLACE_WITH_TOPIC_2_UUID', 'Software and Operating Systems Quiz', 70, now()),
('a3333333-3333-3333-3333-333333333333', 'REPLACE_WITH_TOPIC_3_UUID', 'Internet and Networking Quiz', 70, now()),
('a4444444-4444-4444-4444-444444444444', 'REPLACE_WITH_TOPIC_4_UUID', 'Digital Safety and Security Quiz', 70, now()),
('a5555555-5555-5555-5555-555555555555', 'REPLACE_WITH_TOPIC_5_UUID', 'Productivity Software Quiz', 70, now());

-- Insert Quiz Questions (same as before)

-- Quiz 1: Computer Hardware Fundamentals (10 questions)
INSERT INTO public.quiz_questions (quiz_id, question_text, options, correct_answer, "order") VALUES
('a1111111-1111-1111-1111-111111111111', 'What does CPU stand for?', '["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Computer Processing Utility"]', 'Central Processing Unit', 1),
('a1111111-1111-1111-1111-111111111111', 'Which component is considered the "brain" of the computer?', '["Hard Drive", "RAM", "CPU", "Motherboard"]', 'CPU', 2),
('a1111111-1111-1111-1111-111111111111', 'What type of memory is volatile and loses data when power is turned off?', '["ROM", "Hard Disk", "RAM", "SSD"]', 'RAM', 3),
('a1111111-1111-1111-1111-111111111111', 'Which storage device is faster?', '["HDD", "SSD", "CD-ROM", "Floppy Disk"]', 'SSD', 4),
('a1111111-1111-1111-1111-111111111111', 'What does RAM stand for?', '["Random Access Memory", "Read Access Memory", "Rapid Access Memory", "Runtime Access Memory"]', 'Random Access Memory', 5),
('a1111111-1111-1111-1111-111111111111', 'Which of the following is an input device?', '["Monitor", "Printer", "Keyboard", "Speaker"]', 'Keyboard', 6),
('a1111111-1111-1111-1111-111111111111', 'What is the main circuit board of a computer called?', '["Processor", "Motherboard", "RAM", "Graphics Card"]', 'Motherboard', 7),
('a1111111-1111-1111-1111-111111111111', 'Which port is commonly used for connecting external storage devices?', '["VGA", "HDMI", "USB", "Ethernet"]', 'USB', 8),
('a1111111-1111-1111-1111-111111111111', 'What does GPU stand for?', '["General Processing Unit", "Graphics Processing Unit", "Graphical Program Utility", "General Program Unit"]', 'Graphics Processing Unit', 9),
('a1111111-1111-1111-1111-111111111111', 'Which component stores the BIOS in a computer?', '["RAM", "Hard Drive", "ROM", "CPU Cache"]', 'ROM', 10),

-- Quiz 2: Software and Operating Systems (10 questions)
('a2222222-2222-2222-2222-222222222222', 'Which of the following is NOT an operating system?', '["Windows", "Linux", "Microsoft Word", "macOS"]', 'Microsoft Word', 1),
('a2222222-2222-2222-2222-222222222222', 'What type of software is an operating system?', '["Application Software", "System Software", "Utility Software", "Programming Software"]', 'System Software', 2),
('a2222222-2222-2222-2222-222222222222', 'Which operating system is open source?', '["Windows 11", "macOS", "Linux", "iOS"]', 'Linux', 3),
('a2222222-2222-2222-2222-222222222222', 'What is the file extension for executable files in Windows?', '[".txt", ".exe", ".doc", ".pdf"]', '.exe', 4),
('a2222222-2222-2222-2222-222222222222', 'Which of the following is application software?', '["Windows", "BIOS", "Microsoft Excel", "Device Driver"]', 'Microsoft Excel', 5),
('a2222222-2222-2222-2222-222222222222', 'What does GUI stand for?', '["Graphical User Interface", "General User Interface", "Graphical Utility Interface", "General Utility Interface"]', 'Graphical User Interface', 6),
('a2222222-2222-2222-2222-222222222222', 'Which key combination is commonly used to copy text in most operating systems?', '["Ctrl+V", "Ctrl+C", "Ctrl+X", "Ctrl+Z"]', 'Ctrl+C', 7),
('a2222222-2222-2222-2222-222222222222', 'What is the purpose of a device driver?', '["To create documents", "To browse the internet", "To enable hardware communication with OS", "To protect against viruses"]', 'To enable hardware communication with OS', 8),
('a2222222-2222-2222-2222-222222222222', 'Which of these is a mobile operating system?', '["Windows 10", "Ubuntu", "Android", "Debian"]', 'Android', 9),
('a2222222-2222-2222-2222-222222222222', 'What is virtual memory?', '["Physical RAM only", "Hard disk space used as RAM", "Graphics memory", "Cache memory"]', 'Hard disk space used as RAM', 10),

-- Quiz 3: Internet and Networking (10 questions)
('a3333333-3333-3333-3333-333333333333', 'What does WWW stand for?', '["World Wide Web", "World Web Wide", "Wide World Web", "Web World Wide"]', 'World Wide Web', 1),
('a3333333-3333-3333-3333-333333333333', 'What does IP in IP address stand for?', '["Internet Protocol", "Internal Protocol", "Internet Program", "Internal Program"]', 'Internet Protocol', 2),
('a3333333-3333-3333-3333-333333333333', 'Which device is used to connect a local network to the internet?', '["Switch", "Hub", "Router", "Repeater"]', 'Router', 3),
('a3333333-3333-3333-3333-333333333333', 'What does HTTP stand for?', '["HyperText Transfer Protocol", "High Transfer Text Protocol", "HyperText Transmission Protocol", "High Text Transfer Protocol"]', 'HyperText Transfer Protocol', 4),
('a3333333-3333-3333-3333-333333333333', 'Which is a valid IP address format?', '["192.168.1.1", "192.256.1.1", "999.999.999.999", "12.34.56"]', '192.168.1.1', 5),
('a3333333-3333-3333-3333-333333333333', 'What does DNS stand for?', '["Domain Name System", "Digital Network System", "Domain Network Service", "Digital Name System"]', 'Domain Name System', 6),
('a3333333-3333-3333-3333-333333333333', 'Which protocol is used for sending emails?', '["HTTP", "FTP", "SMTP", "DNS"]', 'SMTP', 7),
('a3333333-3333-3333-3333-333333333333', 'What type of network covers a small geographical area like a building?', '["WAN", "MAN", "LAN", "PAN"]', 'LAN', 8),
('a3333333-3333-3333-3333-333333333333', 'Which port number is typically used for HTTPS?', '["80", "443", "21", "25"]', '443', 9),
('a3333333-3333-3333-3333-333333333333', 'What does ISP stand for?', '["Internet Service Provider", "Internal Service Provider", "Internet System Protocol", "Internal System Provider"]', 'Internet Service Provider', 10),

-- Quiz 4: Digital Safety and Security (10 questions)
('a4444444-4444-4444-4444-444444444444', 'What is phishing?', '["A type of virus", "An attempt to steal sensitive information", "A hardware malfunction", "A programming language"]', 'An attempt to steal sensitive information', 1),
('a4444444-4444-4444-4444-444444444444', 'Which of these is a strong password?', '["password", "12345678", "P@ssw0rd!2024", "abc123"]', 'P@ssw0rd!2024', 2),
('a4444444-4444-4444-4444-444444444444', 'What does malware stand for?', '["Mail Software", "Malicious Software", "Main Software", "Major Software"]', 'Malicious Software', 3),
('a4444444-4444-4444-4444-444444444444', 'Which of the following is antivirus software?', '["Google Chrome", "McAfee", "Microsoft Word", "Adobe Reader"]', 'McAfee', 4),
('a4444444-4444-4444-4444-444444444444', 'What is two-factor authentication?', '["Using two passwords", "An extra layer of security beyond password", "Having two email accounts", "Using two computers"]', 'An extra layer of security beyond password', 5),
('a4444444-4444-4444-4444-444444444444', 'What should you do if you receive a suspicious email?', '["Click all links", "Open attachments", "Delete it or report as spam", "Forward to friends"]', 'Delete it or report as spam', 6),
('a4444444-4444-4444-4444-444444444444', 'What is a firewall?', '["A physical wall", "Security system that monitors network traffic", "A type of virus", "An email filter"]', 'Security system that monitors network traffic', 7),
('a4444444-4444-4444-4444-444444444444', 'How often should you backup important data?', '["Never", "Once a year", "Regularly", "Only when computer crashes"]', 'Regularly', 8),
('a4444444-4444-4444-4444-444444444444', 'What is ransomware?', '["Free software", "Malware that encrypts files and demands payment", "A type of firewall", "A backup system"]', 'Malware that encrypts files and demands payment', 9),
('a4444444-4444-4444-4444-444444444444', 'What should a secure website URL start with?', '["http://", "https://", "ftp://", "www://"]', 'https://', 10),

-- Quiz 5: Productivity Software (10 questions)
('a5555555-5555-5555-5555-555555555555', 'Which software is used for creating spreadsheets?', '["Microsoft Word", "Microsoft Excel", "Microsoft PowerPoint", "Adobe Photoshop"]', 'Microsoft Excel', 1),
('a5555555-5555-5555-5555-555555555555', 'What is the file extension for Microsoft Word documents?', '[".xls", ".ppt", ".doc or .docx", ".pdf"]', '.doc or .docx', 2),
('a5555555-5555-5555-5555-555555555555', 'Which of the following is a cloud storage service?', '["Microsoft Word", "Google Drive", "Adobe Reader", "VLC Player"]', 'Google Drive', 3),
('a5555555-5555-5555-5555-555555555555', 'What formula would you use in Excel to add numbers in cells A1 to A10?', '["=ADD(A1:A10)", "=SUM(A1:A10)", "=TOTAL(A1:A10)", "=COUNT(A1:A10)"]', '=SUM(A1:A10)', 4),
('a5555555-5555-5555-5555-555555555555', 'Which software is best for creating presentations?', '["Excel", "Word", "PowerPoint", "Notepad"]', 'PowerPoint', 5),
('a5555555-5555-5555-5555-555555555555', 'What does PDF stand for?', '["Portable Document Format", "Public Document File", "Portable Data File", "Public Data Format"]', 'Portable Document Format', 6),
('a5555555-5555-5555-5555-555555555555', 'Which shortcut is used to save a file in most applications?', '["Ctrl+S", "Ctrl+P", "Ctrl+O", "Ctrl+N"]', 'Ctrl+S', 7),
('a5555555-5555-5555-5555-555555555555', 'What is Google Docs?', '["A video editor", "A cloud-based word processor", "An antivirus program", "A game"]', 'A cloud-based word processor', 8),
('a5555555-5555-5555-5555-555555555555', 'Which feature in PowerPoint adds movement to slide elements?', '["Transition", "Animation", "Template", "Theme"]', 'Animation', 9),
('a5555555-5555-5555-5555-555555555555', 'What is the purpose of mail merge?', '["To delete emails", "To send personalized documents to multiple recipients", "To compress files", "To scan for viruses"]', 'To send personalized documents to multiple recipients', 10);
