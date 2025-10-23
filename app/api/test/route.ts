import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Test API called')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    return NextResponse.json({ 
      message: 'Test successful', 
      received: body 
    }, { status: 200 })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
