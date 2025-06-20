
import React from "react";
import { LayoutGrid, FileText, BarChart3, Settings, Plus, Clock, Folder } from "lucide-react";

const WorkspaceTab: React.FC = () => {
  return (
    <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="h-full p-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Workspace</h1>
          <p className="text-gray-600">Your central hub for document analysis and workflow management</p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full max-h-[calc(100vh-200px)]">
          
          {/* Quick Actions Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Plus size={20} />
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors">
                  <FileText size={24} className="text-blue-600 mb-2 mx-auto" />
                  <span className="text-sm font-medium text-blue-700">Upload Document</span>
                </button>
                <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
                  <BarChart3 size={24} className="text-green-600 mb-2 mx-auto" />
                  <span className="text-sm font-medium text-green-700">Start Analysis</span>
                </button>
                <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors">
                  <LayoutGrid size={24} className="text-purple-600 mb-2 mx-auto" />
                  <span className="text-sm font-medium text-purple-700">Create Workflow</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock size={20} />
                Recent Activity
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-blue-600" />
                    <span className="text-sm font-medium">Document analysis completed</span>
                  </div>
                  <span className="text-xs text-gray-500">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <BarChart3 size={16} className="text-green-600" />
                    <span className="text-sm font-medium">Grammar check finished</span>
                  </div>
                  <span className="text-xs text-gray-500">4 hours ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Folder size={16} className="text-orange-600" />
                    <span className="text-sm font-medium">New document uploaded</span>
                  </div>
                  <span className="text-xs text-gray-500">1 day ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Tools & Settings */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Settings size={20} />
                Workspace Tools
              </h2>
              <div className="space-y-3">
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3">
                  <FileText size={16} className="text-gray-600" />
                  <span className="text-sm">Document Library</span>
                </button>
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3">
                  <BarChart3 size={16} className="text-gray-600" />
                  <span className="text-sm">Analytics Dashboard</span>
                </button>
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3">
                  <Settings size={16} className="text-gray-600" />
                  <span className="text-sm">Workflow Settings</span>
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Documents Processed</span>
                  <span className="text-sm font-semibold text-gray-800">127</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Workflows</span>
                  <span className="text-sm font-semibold text-gray-800">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Analyses</span>
                  <span className="text-sm font-semibold text-gray-800">45</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceTab;
