#!/bin/bash

echo "=================================="
echo "Navigation Bug Fix Verification"
echo "=================================="
echo ""

echo "Checking pm-roadmap.ts..."
if grep -q "connectedCallback(): void" src/components/pm-roadmap.ts; then
    echo "✓ connectedCallback override present"
else
    echo "✗ connectedCallback override missing"
fi

if grep -q "Don't clear data on unmount" src/components/pm-roadmap.ts; then
    echo "✓ onUnmount comment updated"
else
    echo "✗ onUnmount comment not updated"
fi

if ! grep -q "roadmapData = null" src/components/pm-roadmap.ts | grep -q "onUnmount"; then
    echo "✓ Data clearing removed from onUnmount"
else
    echo "✗ Data still being cleared in onUnmount"
fi

echo ""
echo "Checking pm-app.ts..."
if ! grep -q 'key="roadmap' src/components/pm-app.ts; then
    echo "✓ No key attributes with roadmap"
else
    echo "✗ Key attributes still present"
fi

if ! grep -q 'key="tests' src/components/pm-app.ts; then
    echo "✓ No key attributes with tests"
else
    echo "✗ Key attributes still present"
fi

echo ""
echo "=================================="
echo "Fix verification complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Open http://localhost:5173 in your browser"
echo "3. Test the navigation: Roadmap → Tests → Roadmap"
echo "4. Open http://localhost:5173/test-navigation-fix.html for automated tests"
echo ""
