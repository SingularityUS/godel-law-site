
/**
 * UserSection Component
 * 
 * Purpose: User authentication display and controls
 * This component handles the user-related functionality in the application header,
 * displaying user information and providing logout functionality.
 * 
 * Key Responsibilities:
 * - Displays current user email address
 * - Provides logout button functionality
 * - Integrates with authentication system
 * - Maintains consistent styling with header design
 * 
 * Integration Points:
 * - Uses useAuth hook for authentication state
 * - Handles user logout functionality
 * - Coordinates with overall authentication flow
 * - Integrates with header layout and styling
 * 
 * Authentication Flow:
 * 1. Displays authenticated user's email
 * 2. Provides logout button for session termination
 * 3. Handles authentication state changes
 */

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const UserSection: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm text-black font-bold">
        {user?.email}
      </div>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => signOut()}
        className="border-2 border-black font-bold"
      >
        LOG OUT
      </Button>
    </div>
  );
};

export default UserSection;
