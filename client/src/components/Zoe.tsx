import React from 'react';
import { MapPin, Mail, Phone, Globe, Github, Linkedin, Calendar, Award, BookOpen, Code, Briefcase, GraduationCap, Heart } from 'lucide-react';

function Zoe() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header Section */}
      <div className="bg-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-48 h-48 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-6xl font-bold shadow-xl">
              Z
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">Zoe</h1>
              <h2 className="text-2xl text-pink-600 font-semibold mb-6">Professional & Creative Specialist</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <MapPin className="h-5 w-5 text-pink-500" />
                  <span>Location Available Upon Request</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Mail className="h-5 w-5 text-pink-500" />
                  <a href="mailto:zoe@example.com" className="hover:text-pink-600 transition-colors">
                    zoe@example.com
                  </a>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Phone className="h-5 w-5 text-pink-500" />
                  <span>Contact Available Upon Request</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Globe className="h-5 w-5 text-pink-500" />
                  <span>Multilingual Professional</span>
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
            <Heart className="h-6 w-6 text-pink-500" />
            About Me
          </h3>
          <p className="text-gray-700 leading-relaxed text-lg">
            A dedicated professional with a passion for excellence and innovation. I bring creativity, 
            analytical thinking, and strong communication skills to every project. Currently expanding 
            my expertise and looking forward to new opportunities and challenges.
          </p>
        </section>

        {/* Education */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-pink-500" />
            Education
          </h3>
          <div className="space-y-6">
            <div className="border-l-4 border-pink-500 pl-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <h4 className="text-xl font-semibold text-gray-900">Bachelor's Degree</h4>
                <span className="text-pink-600 font-medium">Location</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                <p className="text-gray-600">University Name</p>
                <span className="text-gray-500">Year - Year</span>
              </div>
              <ul className="text-gray-700 space-y-1">
                <li>• Major: [To be updated]</li>
                <li>• Relevant coursework and achievements</li>
                <li>• Academic honors and distinctions</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Skills */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Award className="h-6 w-6 text-pink-500" />
            Core Competencies
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Professional Skills</h4>
              <div className="flex flex-wrap gap-2">
                {['Communication', 'Project Management', 'Problem Solving', 'Leadership', 'Teamwork', 'Analysis'].map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Technical Skills</h4>
              <div className="flex flex-wrap gap-2">
                {['Microsoft Office', 'Data Analysis', 'Research', 'Presentation', 'Documentation', 'Planning'].map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Creative Skills</h4>
              <div className="flex flex-wrap gap-2">
                {['Design Thinking', 'Creative Writing', 'Visual Arts', 'Innovation', 'Brainstorming', 'Conceptualization'].map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Languages</h4>
              <div className="flex flex-wrap gap-2">
                {['English (Fluent)', 'Additional Languages', 'Cross-Cultural Communication'].map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Experience */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-pink-500" />
            Professional Experience
          </h3>
          
          <div className="space-y-8">
            <div className="border-l-4 border-pink-500 pl-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <h4 className="text-xl font-semibold text-gray-900">Position Title</h4>
                <span className="text-pink-600 font-medium">Date - Date</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <p className="text-gray-600 font-medium">Company/Organization Name</p>
                <span className="text-gray-500">Location</span>
              </div>
              <ul className="text-gray-700 space-y-2">
                <li>• Key responsibility and achievement</li>
                <li>• Major project or initiative led</li>
                <li>• Quantifiable results and impact</li>
                <li>• Skills developed and applied</li>
              </ul>
            </div>

            <div className="border-l-4 border-purple-500 pl-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <h4 className="text-xl font-semibold text-gray-900">Previous Position</h4>
                <span className="text-purple-600 font-medium">Date - Date</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <p className="text-gray-600 font-medium">Previous Company/Organization</p>
                <span className="text-gray-500">Location</span>
              </div>
              <ul className="text-gray-700 space-y-2">
                <li>• Notable accomplishment or project</li>
                <li>• Leadership or collaborative experience</li>
                <li>• Process improvement or innovation</li>
                <li>• Professional growth and learning</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Projects & Achievements */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Award className="h-6 w-6 text-pink-500" />
            Projects & Achievements
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Featured Project</h4>
              <p className="text-gray-600 mb-4">
                Description of a significant project, initiative, or accomplishment that demonstrates 
                skills, creativity, and impact.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Skill 1', 'Skill 2', 'Skill 3', 'Tool/Method'].map((tech) => (
                  <span key={tech} className="px-2 py-1 bg-pink-50 text-pink-700 rounded text-sm">{tech}</span>
                ))}
              </div>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Key outcome or result achieved</li>
                <li>• Methodology or approach used</li>
                <li>• Impact on organization or community</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Creative Initiative</h4>
              <p className="text-gray-600 mb-4">
                A creative project or innovative solution that showcases problem-solving abilities 
                and unique perspective.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Creativity', 'Innovation', 'Design', 'Implementation'].map((tech) => (
                  <span key={tech} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm">{tech}</span>
                ))}
              </div>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Creative approach or unique solution</li>
                <li>• Collaboration and teamwork involved</li>
                <li>• Positive feedback or recognition received</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Leadership Experience</h4>
              <p className="text-gray-600 mb-4">
                Leadership role or initiative that demonstrates ability to guide, motivate, 
                and achieve results through others.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Leadership', 'Team Management', 'Strategy', 'Communication'].map((tech) => (
                  <span key={tech} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-sm">{tech}</span>
                ))}
              </div>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Team size and scope of responsibility</li>
                <li>• Challenges overcome and solutions implemented</li>
                <li>• Measurable outcomes and team development</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Community Involvement</h4>
              <p className="text-gray-600 mb-4">
                Volunteer work, community service, or social impact initiative that demonstrates 
                commitment to making a positive difference.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Volunteer Work', 'Community Service', 'Social Impact', 'Organizing'].map((tech) => (
                  <span key={tech} className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm">{tech}</span>
                ))}
              </div>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Organization or cause supported</li>
                <li>• Role and responsibilities undertaken</li>
                <li>• Impact on community or beneficiaries</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Interests & Goals */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-pink-500" />
            Interests & Professional Goals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Professional Interests</h4>
              <ul className="text-gray-700 space-y-2">
                <li>• Continuous learning and professional development</li>
                <li>• Innovation and creative problem-solving</li>
                <li>• Collaborative team environments</li>
                <li>• Making meaningful contributions to projects</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Career Goals</h4>
              <ul className="text-gray-700 space-y-2">
                <li>• Expanding expertise in chosen field</li>
                <li>• Taking on leadership responsibilities</li>
                <li>• Contributing to impactful projects</li>
                <li>• Building lasting professional relationships</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl shadow-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Let's Connect</h3>
          <p className="text-lg mb-6 opacity-90">
            I'm always interested in new opportunities and meaningful connections. 
            Feel free to reach out to discuss potential collaborations or just to say hello!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:zoe@example.com" 
              className="bg-white text-pink-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Send Email
            </a>
            <a 
              href="#" 
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-pink-600 transition-colors"
            >
              View LinkedIn
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Zoe;