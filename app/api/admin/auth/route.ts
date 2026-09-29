import { cookies } from 'next/headers'
import { createToken, getAdminSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()
    const adminUser = process.env.ADMIN_USERNAME || 'admin'
    const adminPass = process.env.ADMIN_PASSWORD || 'onlyandey2024'

    if (username === adminUser && password === adminPass) {
      const token = await createToken({ role: 'admin' })
      cookies().set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })
      return Response.json({ success: true })
    }
    return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
  } catch (error) {
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  const session = await getAdminSession()
  return Response.json({ authenticated: !!session })
}

export async function DELETE() {
  cookies().delete('admin_token')
  return Response.json({ success: true })
}
