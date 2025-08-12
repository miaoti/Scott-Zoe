import { Heart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function Settings() {

  // Settings functionality has been simplified - days together is now calculated in real-time

  return (
    <div className="min-h-screen bg-apple-secondary-background">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-apple-blue hover:text-apple-blue/80 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-apple-blue/10 p-4 rounded-2xl">
                <Heart className="h-8 w-8 text-apple-blue" fill="currentColor" />
              </div>
            </div>
            <h1 className="font-heading text-4xl font-semibold text-apple-label mb-3">
              Relationship Settings
            </h1>
            <p className="text-apple-secondary-label text-lg">
              Customize your love story timeline
            </p>
          </div>
        </div>

        {/* Settings Info */}
        <div className="apple-card apple-shadow p-8">
          <div className="text-center space-y-6">
            <div className="bg-apple-blue/5 border border-apple-blue/20 rounded-xl p-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-apple-blue mb-3">
                  💕
                </div>
                <div className="text-xl font-semibold text-apple-label mb-2">
                  Your Love Story
                </div>
                <div className="text-apple-secondary-label">
                  Started on June 8th, 2024
                </div>
                <div className="text-sm text-apple-tertiary-label mt-4">
                  Watch your days together count up in real-time in the header!
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-apple-secondary-label">
                Your relationship timeline is automatically calculated and updates every second.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-apple-tertiary-label">
            Your love story began on June 8th, 2024. Every moment since then is precious! 💖
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;