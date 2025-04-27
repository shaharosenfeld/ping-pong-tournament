import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const registrationId = formData.get('registrationId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'לא נמצא קובץ בבקשה' },
        { status: 400 }
      );
    }

    if (!registrationId) {
      return NextResponse.json(
        { error: 'חסר מזהה הרשמה' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'סוג קובץ לא תקין. ניתן להעלות רק תמונות (JPG, PNG) ומסמכי PDF' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'גודל הקובץ המקסימלי הוא 5MB' },
        { status: 400 }
      );
    }

    // Get file extension
    const fileExtension = file.name.split('.').pop() || '';
    if (!fileExtension) {
      return NextResponse.json(
        { error: 'לא ניתן לקבוע את סוג הקובץ' },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const uniqueId = uuidv4();
    const fileName = `payment-${registrationId}-${uniqueId}.${fileExtension}`;
    
    // Create uploads directory structure if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'payments');
    
    try {
      // Convert the file to a buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Write the file to the filesystem
      const filePath = join(uploadsDir, fileName);
      await writeFile(filePath, buffer);
      
      // Return the URL to the uploaded file
      const fileUrl = `/uploads/payments/${fileName}`;
      
      return NextResponse.json({
        message: 'הקובץ הועלה בהצלחה',
        url: fileUrl,
        fileName
      });
    } catch (writeError) {
      console.error('Error writing file:', writeError);
      return NextResponse.json(
        { error: 'שגיאה בשמירת הקובץ' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      { error: 'שגיאה בעיבוד העלאת הקובץ' },
      { status: 500 }
    );
  }
} 