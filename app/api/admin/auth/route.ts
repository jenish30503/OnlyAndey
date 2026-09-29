import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_only_andey_2024')

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()
    const adminUser = process.env.ADMIN_USERNAME || 'admin'
    const adminPass = process.env.ADMIN_PASSWORD || 'onlyandey2024'

    if (username === adminUser && password === adminPass) {
      const token = await new SignJWT({ role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(SECRET_KEY)
      
      const cookieStore = await cookies()
      cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })
      return Response.json({ success: true })
    }
    return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value
    if (!token) return Response.json({ authenticated: false })
    await jwtVerify(token, SECRET_KEY)
    return Response.json({ authenticated: true })
  } catch (err) {
    return Response.json({ authenticated: false })
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_token')
  return Response.json({ success: true })
}
