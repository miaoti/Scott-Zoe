import React from 'react';
import { MapPin, Mail, Phone, Globe, Github, Linkedin, Calendar, Award, BookOpen, Code, Briefcase, GraduationCap } from 'lucide-react';

function Scott() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Professional Photo */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative">
                <div className="w-80 h-80 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-50 to-purple-50">
                  <img 
                    src="https://github.com/miaoti/Test/blob/main/ResumeICON.png?raw=true" 
                    alt="Tingshuo Miao" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl opacity-20"></div>
              </div>
            </div>
            
            {/* Hero Content */}
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Tingshuo <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Miao</span>
                </h1>
                <p className="text-2xl text-gray-600 font-light">PhD Student in Computer Science</p>
                <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
                  Passionate researcher specializing in microservice architecture, software engineering, and system quality assurance. 
                  Dedicated to advancing the field through innovative testing methodologies and robust system design.
                </p>
              </div>
              
              {/* Contact & Social Links */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <a href="mailto:tingshuo_miao2@baylor.edu" 
                   className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <Mail className="h-5 w-5" />
                  <span className="font-medium">Email</span>
                </a>
                <a href="https://www.linkedin.com/in/tingshuo-miao-823912232" target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200">
                  <Linkedin className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">LinkedIn</span>
                </a>
                <a href="https://github.com/miaoti/" target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200">
                  <Github className="h-5 w-5 text-gray-700" />
                  <span className="font-medium">GitHub</span>
                </a>
              </div>
              
              {/* Quick Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span>Waco/, TX (Open to Relocation)</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Globe className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span>F1 Visa (English & Native Mandarin)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        
        {/* Research Focus */}
        <section className="relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Research & Expertise</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advancing software engineering through innovative research in microservice architectures and quality assurance
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <Code className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Microservice Testing</h3>
                <p className="text-gray-600 leading-relaxed">
                  Developing comprehensive testing methodologies for distributed microservice architectures to ensure system reliability and performance.
                </p>
              </div>
            </div>
            
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quality Assurance</h3>
                <p className="text-gray-600 leading-relaxed">
                  Researching innovative approaches to software quality metrics and system availability measurement in distributed environments.
                </p>
              </div>
            </div>
            
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Academic Research</h3>
                <p className="text-gray-600 leading-relaxed">
                  Contributing to the academic community through peer-reviewed publications and collaborative research initiatives.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Education */}
        <section className="relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Education</h2>
            <p className="text-xl text-gray-600">Academic foundation in computer science and mathematics</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* PhD */}
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Baylor University</h3>
                    <p className="text-blue-600 font-medium">Waco, TX</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">PhD in Computer Science</h4>
                    <p className="text-gray-500 font-medium">Aug 2022 - Present</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700"><strong>Research Focus:</strong> Software Engineering, Microservice Testing & Quality Assurance</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700"><strong>Coursework:</strong> Advanced Algorithms, Distributed Systems, Software Engineering Research Methods, Microservice Testing</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bachelor's */}
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">UMass Amherst</h3>
                    <p className="text-purple-600 font-medium">Amherst, MA</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">BS in Applied Mathematics</h4>
                    <p className="text-gray-500 font-medium">Sep 2018 - Jan 2022</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700"><strong>Honors:</strong> Dean's List (Fall 2019, Spring 2019, Fall 2020)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700"><strong>Foundation:</strong> Mathematical modeling and statistical analysis</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Skills */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Code className="h-6 w-6 text-blue-500" />
            Technical Skills
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Programming Languages</h4>
              <div className="flex flex-wrap gap-2">
                {['Java (8+)', 'Python', 'JavaScript/TypeScript', 'C++', 'HTML/CSS', 'Bash'].map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Frameworks & Libraries</h4>
              <div className="flex flex-wrap gap-2">
                {['Spring Boot', 'React', 'Node.js', 'Express', 'JUnit', 'Mockito', 'jQuery', 'NumPy', 'Pandas', 'TensorFlow'].map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Databases & Tools</h4>
              <div className="flex flex-wrap gap-2">
                {['PostgreSQL', 'MySQL', 'MongoDB', 'Git', 'Docker', 'AWS', 'Postman', 'IntelliJ', 'VS Code'].map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Concepts & Methodologies</h4>
              <div className="flex flex-wrap gap-2">
                {['Microservice Architecture', 'REST APIs', 'System Availability', 'Metrics', 'Test Automation', 'Agile', 'CI/CD'].map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Professional Experience */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-blue-500" />
            Professional Experience
          </h3>
          
          <div className="space-y-8">
            {/* Teaching Experience */}
            <div className="border-l-4 border-blue-500 pl-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <h4 className="text-xl font-semibold text-gray-900">Graduate Teaching & Research Assistant</h4>
                <span className="text-blue-600 font-medium">Aug 2022 - Present</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <p className="text-gray-600 font-medium">Baylor University</p>
                <span className="text-gray-500">Waco, TX</span>
              </div>
              <ul className="text-gray-700 space-y-2">
                <li>• <strong>Teaching Responsibilities:</strong> Taught undergraduate CS courses, led discussion sections, held office hours, graded assignments, developed instructional materials</li>
                <li>• <strong>Research Activities:</strong> Supported faculty research, conducted literature reviews, collected/analyzed experimental data, co-authored publications on microservice testing</li>
                <li>• <strong>Student Mentoring:</strong> Mentored 50+ students in programming fundamentals, data structures, algorithms, and software development best practices</li>
                <li>• <strong>Academic Contributions:</strong> Contributed to research projects focusing on software engineering and microservice architecture quality assurance</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Projects */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Code className="h-6 w-6 text-blue-500" />
            Featured Projects
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Couple Website */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Scott & Zoe Couple Website</h4>
              <p className="text-gray-600 mb-4">
                Full-stack web application for couples to share memories, photos, and special moments with beautiful UI/UX design.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['React', 'TypeScript', 'Spring Boot', 'PostgreSQL', 'Railway', 'Docker'].map((tech) => (
                  <span key={tech} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">{tech}</span>
                ))}
              </div>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Responsive design with modern UI components and animations</li>
                <li>• RESTful API with comprehensive error handling and validation</li>
                <li>• Deployed on Railway with CI/CD pipeline and custom domain</li>
              </ul>
            </div>

            {/* Health Management Platform */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">WellnessPathway v2 — Health Management Platform</h4>
              <p className="text-gray-600 mb-4">
                Microservice-based health monitoring system with real-time metrics and automated alerting capabilities.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Spring Boot', 'Microservices', 'Grafana', 'Prometheus', 'Docker', 'GitLab CI'].map((tech) => (
                  <span key={tech} className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm">{tech}</span>
                ))}
              </div>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Implemented health check endpoints with Spring Boot Actuator</li>
                <li>• Integrated monitoring dashboards with real-time alerting</li>
                <li>•	Monitored system health via Grafana/Prometheus; participated in release cycles, backup strategies, and incident response</li>
              </ul>
            </div>

            {/* Research Projects */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Microservice Testing Research</h4>
              <p className="text-gray-600 mb-4">
                Comprehensive research on test generation methodologies for microservice architectures, focusing on system quality and reliability.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Java', 'Spring Boot', 'JUnit', 'Mockito', 'Docker', 'Research Methodology'].map((tech) => (
                  <span key={tech} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm">{tech}</span>
                ))}
              </div>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Systematic mapping study of microservice testing approaches</li>
                <li>• Development of Service Availability Ratio (SAR) metric</li>
                <li>• Published research findings in peer-reviewed journals</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Publications */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-blue-500" />
            Publications
          </h3>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                "Systematic Mapping Study of Test Generation for Microservices: Approaches, Challenges, and Impact on System Quality"
              </h4>
              <p className="text-gray-600 mb-2">
                <strong>Miao, T.</strong>, Shaafi, A. I., & Song, E. (2025). <em>Electronics</em>, 14(7), 1397.
              </p>
              <p className="text-gray-700 text-sm mb-2">
                Comprehensive analysis of microservice testing methodologies and their impact on system reliability and performance.
              </p>
              <a href="https://doi.org/10.3390/electronics14071397" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                https://doi.org/10.3390/electronics14071397
              </a>
            </div>
            
            <div className="border-l-4 border-green-500 pl-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                "Service Availability Ratio (SAR): An Availability Metric for Microservices"
              </h4>
              <p className="text-gray-600 mb-2">
                <strong>Miao, T.</strong>, & Shaafi, A. I. (2025). In <em>Lecture Notes in Computer Science</em> (Vol. 14678, pp. 112–127). Springer.
              </p>
              <p className="text-gray-700 text-sm mb-2">
                Novel availability metric for microservice architectures that considers end-to-end service dependencies and system reliability.
              </p>
              <a href="https://doi.org/10.1007/978-3-031-86644-9_8" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                https://doi.org/10.1007/978-3-031-86644-9_8
              </a>
            </div>
          </div>
        </section>

        {/* Academic & Teaching Experience */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-blue-500" />
            Academic & Teaching Experience
          </h3>
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <h4 className="text-lg font-semibold text-gray-900">Graduate Teaching & Research Assistant</h4>
                <span className="text-blue-600 font-medium">Aug 2022 - Present</span>
              </div>
              <p className="text-gray-600 mb-3">Baylor University</p>
              <ul className="text-gray-700 space-y-1">
                <li>• <strong>Teaching Responsibilities:</strong> Taught undergraduate CS courses, led discussion sections, held office hours, graded assignments, developed instructional materials</li>
                <li>• <strong>Research Activities:</strong> Supported faculty research, conducted literature reviews, collected/analyzed experimental data, co-authored publications on microservice testing</li>
                <li>• <strong>Student Mentoring:</strong> Mentored 50+ students in programming fundamentals, data structures, algorithms, and software engineering best practices</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Scott;