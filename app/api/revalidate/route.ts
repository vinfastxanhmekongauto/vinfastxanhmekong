import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    // 1. Parse request body to extract url
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "url" field in request body.' },
        { status: 400 }
      );
    }

    // 2. Extract and check credentials
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      console.error('Google Indexing API credentials are not configured in environment variables.');
      return NextResponse.json(
        { error: 'Google Indexing API credentials are not configured.' },
        { status: 500 }
      );
    }

    // CRITICAL: ensure newline characters in the private key are parsed correctly
    privateKey = privateKey.replace(/\\n/g, '\n');

    // 3. Authenticate using google.auth.JWT with an options object
    const jwtClient = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    // 4. Make a POST request to https://indexing.googleapis.com/v3/urlNotifications:publish
    // using jwtClient.request automatically authorizes the request.
    const response = await jwtClient.request({
      url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
      method: 'POST',
      data: {
        url: url,
        type: 'URL_UPDATED',
      },
    });

    // 5. Return success response
    return NextResponse.json({
      success: true,
      data: response.data,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Google Indexing API Revalidation Error:', error);

    const errorMessage = error?.response?.data?.error?.message || error?.message || 'Internal Server Error';
    const errorStatus = error?.response?.status || 500;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error?.response?.data || null,
      },
      { status: errorStatus }
    );
  }
}
