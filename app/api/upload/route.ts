import { NextResponse } from 'next/server'
import { cloudinary } from '@/lib/Cloudinary'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

   const uploaded = await new Promise((resolve, reject) => {
  cloudinary.uploader.upload_stream(
    { 
      resource_type: 'auto',
      format: 'pdf' // Force PDF format for PDF files
    }, 
    (err, result) => {
      if (err) return reject(err)
      resolve(result)
    }
  ).end(buffer)
})

    return NextResponse.json({ url: (uploaded as any).secure_url })

  } catch (error) {
    console.error('❌ Upload failed:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}


// usecases : of this api: OUT: GET AN URL of cloudinary 

// const uploadFile = async (file: File) => {
//   const formData = new FormData()
//   formData.append('file', file)

//   const res = await fetch('/api/upload', {
//     method: 'POST',
//     body: formData,
//   })

//   const data = await res.json()
//   return data.url // this is your Cloudinary image URL
// }
