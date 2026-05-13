export function middleware(request) {
  const authHeader = request.headers.get('authorization');
  const username = process.env.BASIC_AUTH_USER || 'admin'; // You can use env variables or hardcode
  const password = process.env.BASIC_AUTH_PASSWORD || 'your-password';

  if (authHeader) {
    const base64Credentials = authHeader.split(' ')[1];
    // Use atob for edge runtime compatibility (Buffer might not be natively available everywhere)
    const credentials = atob(base64Credentials);
    const [enteredUser, ...passwordParts] = credentials.split(':');
    const enteredPass = passwordParts.join(':');

    if (enteredUser === username && enteredPass === password) {
      return; // Allow access
    }
  }

  // Ask for credentials
  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
  });
}

// Optionally scope this to specific routes, right now it applies everywhere
// export const config = {
//   matcher: '/admin/:path*',
// };
