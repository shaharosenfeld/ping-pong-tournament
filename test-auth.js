// Script to test authentication with knockout API
async function testKnockoutAuthentication() {
  // Get the admin token from localStorage (run this in browser console)
  const adminToken = localStorage.getItem('adminToken');
  console.log('Admin token:', adminToken);
  
  // Set the tournament ID you want to test with
  const tournamentId = '152d38bd-297b-4fe4-b50b-7ab3f6ef235b';
  
  try {
    // Try using both query parameter and header for token
    const response = await fetch(`/api/tournaments/${tournamentId}/generate-knockout?token=${encodeURIComponent(adminToken)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('Response status:', response.status);
    
    // Try to parse response as JSON
    try {
      const data = await response.json();
      console.log('Response data:', data);
    } catch (jsonError) {
      console.error('Error parsing JSON:', jsonError);
      const text = await response.text();
      console.log('Response text:', text);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// To use this script:
// 1. Copy this entire file
// 2. Open your browser DevTools (F12 or Cmd+Option+I)
// 3. Navigate to your tournament page
// 4. Paste this code in the Console tab
// 5. Log in as admin if you haven't already
// 6. Run the function by typing: testKnockoutAuthentication() 