
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function EmailVerified() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div 
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 relative"
      style={{
        backgroundImage: `url('/lovable-uploads/2450f682-9da7-405e-8c7d-ef5b072c1a0a.png')`,
        backgroundSize: '200px 200px',
        backgroundRepeat: 'repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay to make background more subtle */}
      <div className="absolute inset-0 bg-white/80"></div>
      
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <img 
              src="/lovable-uploads/2450f682-9da7-405e-8c7d-ef5b072c1a0a.png" 
              alt="Godel Logo" 
              className="w-16 h-16 mx-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Godel</h1>
        </div>

        <Card className="p-8 shadow-lg bg-white/95 backdrop-blur-sm border-0 text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600 text-base">
              Thank you for verifying your email address. Your account is now active and ready to use.
            </p>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-4">
              You'll be automatically redirected to the homepage in {countdown} seconds.
            </p>
            <Button onClick={handleGoHome} className="w-full h-12 text-base font-medium">
              Continue to Godel
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
