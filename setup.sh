#!/bin/bash

# Multi-API Dashboard - Discovery Challenge Setup
# Activity 03: API Integration Mastery

echo "🎯 Setting up Multi-API Dashboard Discovery Challenge..."
echo ""

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Please run this script from the activity-03-multi-api directory"
    echo "   Make sure you have index.html in the current directory"
    exit 1
fi

echo "📋 Checking required files..."

# Check for required files
required_files=("index.html" "script.js" "styles.css" "README.md" "package.json")
missing_files=()

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (missing)"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo ""
    echo "❌ Missing required files. Please ensure all template files are present."
    exit 1
fi

echo ""
echo "🌐 Testing API connectivity..."

# Test different APIs
apis=("https://api.nasa.gov" "https://api.giphy.com" "https://superheroapi.com")
working_apis=0

for api in "${apis[@]}"; do
    if curl -s --head --max-time 5 "$api" > /dev/null 2>&1; then
        echo "   ✅ ${api##*/} API is accessible"
        ((working_apis++))
    else
        echo "   ⚠️  ${api##*/} API may be temporarily unavailable"
    fi
done

echo ""
echo "🔑 API Key Setup Required:"
echo "   🦸 Superhero API: Get key from superheroapi.com"
echo "   🚀 NASA API: Free key from api.nasa.gov (or use DEMO_KEY)"
echo "   🎭 GIPHY API: Free key from developers.giphy.com"
echo "   🎬 TMDB API: Free key from themoviedb.org"
echo ""

echo "📚 Discovery Challenge Overview:"
echo "   🎯 4 Different APIs with unique authentication patterns"
echo "   🔐 Focus: Authentication, API patterns, data integration"
echo "   🔬 Method: Comparative API analysis and implementation"
echo ""

echo "🚀 Starting local development server..."
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "   📡 Server will start at: http://localhost:8000"
    echo "   🛑 Press Ctrl+C to stop the server"
    echo ""
    echo "🎓 DISCOVERY LEARNING APPROACH:"
    echo "   1. Compare different authentication patterns across APIs"
    echo "   2. Study how each API structures its endpoints"
    echo "   3. Experiment with different parameter formats"
    echo "   4. Build a unified interface for multiple APIs"
    echo "   5. Learn professional API integration patterns"
    echo ""
    echo "📖 Learning Objectives:"
    echo "   • Master different authentication methods"
    echo "   • Compare API design patterns"
    echo "   • Handle multiple data sources efficiently"
    echo "   • Build professional dashboard interfaces"
    echo "   • Manage API keys and configurations securely"
    echo ""
    echo "🔬 Research Areas:"
    echo "   • Path-based vs Query-based authentication"
    echo "   • Rate limiting and API quotas"
    echo "   • Media vs Data API patterns"
    echo "   • Error handling across different services"
    echo "   • Unified user experience design"
    echo ""
    echo "🔥 Starting development server..."
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "   📡 Server will start at: http://localhost:8000"
    echo "   🛑 Press Ctrl+C to stop the server"
    echo ""
    python -m SimpleHTTPServer 8000
else
    echo "   ❌ Python not found. Please install Python or use an alternative server."
    echo ""
    echo "🔧 Alternative options:"
    echo "   • Use Live Server extension in VS Code"
    echo "   • Use 'npx serve .' if you have Node.js"
    echo "   • Upload to StackBlitz or CodePen"
    echo ""
fi

echo ""
echo "✨ Happy discovering! Master API integration through hands-on exploration! 🎯"