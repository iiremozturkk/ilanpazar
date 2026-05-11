import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const file = await queryOne(
      `SELECT mime_type, file_data FROM uploaded_files WHERE id = ?`,
      [id]
    )

    if (!file?.file_data || !file?.mime_type) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const data = file.file_data instanceof Uint8Array ? file.file_data : new Uint8Array(file.file_data.data || file.file_data)

    return new NextResponse(data, {
      headers: {
        'Content-Type': file.mime_type,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    console.error('[upload/:id GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
