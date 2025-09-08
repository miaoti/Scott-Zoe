import React from 'react';
import { MapPin, Mail, Phone, Globe, Github, Linkedin, Calendar, Award, BookOpen, Code, Briefcase, GraduationCap } from 'lucide-react';

function Scott() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Section */}
      <div className="bg-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-48 h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-6xl font-bold shadow-xl">
              TM
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">Tingshuo Miao</h1>
              <h2 className="text-2xl text-blue-600 font-semibold mb-6">PhD Student</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <span>Waco, TX (Open to Relocation)</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <a href="mailto:tingshuo_miao2@baylor.edu" className="hover:text-blue-600 transition-colors">
                    tingshuo_miao2@baylor.edu
                  </a>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Phone className="h-5 w-5 text-blue-500" />
                  <span>+1 (541) 979-1876</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <span>F1 Visa (English & Native Mandarin)</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Linkedin className="h-5 w-5 text-blue-500" />
                  <a href="https://www.linkedin.com/in/tingshuo-miao-823912232" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                    LinkedIn Profile
                  </a>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Github className="h-5 w-5 text-blue-500" />
                  <a href="https://github.com/miaoti/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                    GitHub Profile
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        {/* Professional Objective */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Award className="h-6 w-6 text-blue-500" />
            Professional Objective
          </h3>
          <p className="text-gray-700 leading-relaxed text-lg">
            Passionate about building reliable, scalable software solutions and system optimization as a collaborative, product-driven environment. 
            Passionate about building reliable, scalable software solutions and system optimization as a collaborative, product-driven environment. 
            Passionate about building reliable, scalable software solutions and system optimization as a collaborative, product-driven environment.
          </p>
        </section>

        {/* Education */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-blue-500" />
            Education
          </h3>
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <h4 className="text-xl font-semibold text-gray-900">Baylor University</h4>
                <span className="text-blue-600 font-medium">Waco, TX</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                <p className="text-gray-600">PhD in Computer Science</p>
                <span className="text-gray-500">Aug 2021 - Present</span>
              </div>
              <ul className="text-gray-700 space-y-1">
                <li>• <strong>Research Focus:</strong> Software Engineering, Microservice Testing & Quality Assurance</li>
                <li>• <strong>Relevant Coursework:</strong> Advanced Algorithms, Distributed Systems, Software Engineering Research Methods, Microservice Testing</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <h4 className="text-xl font-semibold text-gray-900">University of Massachusetts Amherst</h4>
                <span className="text-purple-600 font-medium">Amherst, MA</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                <p className="text-gray-600">Bachelor of Science in Applied Mathematics/Secondary Major</p>
                <span className="text-gray-500">Sep 2018 - Jan 2022</span>
              </div>
              <ul className="text-gray-700 space-y-1">
                <li>• Dean's List Honors (Fall 2019, Spring 2019, Fall 2020)</li>
                <li>• <strong>Academic Excellence:</strong> Strong foundation in mathematical modeling and statistical analysis</li>
              </ul>
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