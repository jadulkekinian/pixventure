# JDK Web Integration Guide for PixVenture

This guide shows how to integrate PixVenture game into your JDK web application using iframe.

## Quick Start

### 1. Add Game Page to Your Vite App

```typescript
// src/pages/GamePage.tsx or similar location
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase'; // Your existing Supabase client

export function GamePage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Listen for messages from game iframe
    window.addEventListener('message', handleGameMessage);
    return () => window.removeEventListener('message', handleGameMessage);
  }, []);

  const handleGameMessage = async (event: MessageEvent) => {
    // Validate origin for security
    if (event.origin !== 'https://pixventure.vercel.app') {
      return;
    }

    if (event.data.type === 'REQUEST_USER_DATA') {
      await sendUserDataToGame();
    }

    if (event.data.type === 'GAME_READY') {
      console.log('Game is ready!');
    }
  };

  const sendUserDataToGame = async () => {
    try {
      // Get current session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();

      if (!session || !user) {
        console.error('No active session');
        return;
      }

      // Prepare user data
      const userData = {
        type: 'USER_DATA',
        payload: {
          memberId: user.id,
          username: user.user_metadata.username || user.email?.split('@')[0] || 'Player',
          session: session.access_token,
          email: user.email,
        }
      };

      // Send to game iframe
      iframeRef.current?.contentWindow?.postMessage(
        userData,
        'https://pixventure.vercel.app' // Game URL
      );

      console.log('User data sent to game:', userData.payload.username);
    } catch (error) {
      console.error('Error sending user data:', error);
    }
  };

  return (
    <div className="game-page-container">
      <h1>PixVenture Game</h1>
      
      <iframe
        ref={iframeRef}
        src="https://pixventure.vercel.app"
        width="100%"
        height="800px"
        frameBorder="0"
        allow="autoplay; fullscreen"
        onLoad={sendUserDataToGame}
        style={{
          border: '2px solid #facc15',
          borderRadius: '8px',
        }}
      />
    </div>
  );
}
```

### 2. Add Route in Your Router

```typescript
// In your router configuration (React Router example)
import { GamePage } from '@/pages/GamePage';

// Add to your routes
{
  path: '/game',
  element: <GamePage />,
  // Add auth guard if needed
}
```

### 3. Add Navigation Link

```typescript
// In your navigation component
<Link to="/game">
  🎮 Play PixVenture
</Link>
```

## Configuration

### Environment Variables (JDK Web)

```env
# .env
VITE_GAME_URL=https://pixventure.vercel.app
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Security

> **Important:** Always validate message origins!

```typescript
// Always check origin before processing messages
if (event.origin !== process.env.VITE_GAME_URL) {
  console.warn('Rejected message from unknown origin:', event.origin);
  return;
}
```

## postMessage API Reference

### Messages FROM JDK Web → Game

#### USER_DATA
Sends user authentication data to the game.

```typescript
{
  type: 'USER_DATA',
  payload: {
    memberId: string;    // User ID from Supabase
    username: string;    // Display name
    session: string;     // Supabase access token
    email?: string;      // Optional email
  }
}
```

### Messages FROM Game → JDK Web

#### REQUEST_USER_DATA
Game requests user data.

```typescript
{
  type: 'REQUEST_USER_DATA'
}
```

#### GAME_READY
Game notifies it's ready to receive data.

```typescript
{
  type: 'GAME_READY'
}
```

## Testing Checklist

- [ ] User data successfully passed to game
- [ ] Username displays correctly in game
- [ ] Game progress saves to database
- [ ] Can load previous adventure
- [ ] Works in production (HTTPS)
- [ ] CORS configured correctly

## Troubleshooting

### Issue: Game doesn't receive user data

**Solution:**
1. Check browser console for postMessage errors
2. Verify iframe src URL matches origin validation
3. Ensure Supabase session is active
4. Check that game has loaded completely (listen for GAME_READY)

### Issue: 404 or CORS errors

**Solution:**
1. Verify game deployment URL is correct
2. Check Supabase RLS policies allow the session
3. Ensure both sites use HTTPS in production

## Advanced: Custom Styling

```typescript
<iframe
  ref={iframeRef}
  src={process.env.VITE_GAME_URL}
  width="100%"
  height="100vh"
  frameBorder="0"
  allow="autoplay; fullscreen"
  className="game-iframe"
  style={{
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
  }}
/>
```

## Support

For issues or questions:
- Check the integration plan document
- Review browser console for errors
- Verify all environment variables are set

---

**Ready to integrate?** Copy the `GamePage.tsx` code above and customize as needed! 🚀
