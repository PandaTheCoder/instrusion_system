import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '../../../db/database';
import { GetBucketNotificationConfigurationCommand } from '@aws-sdk/client-s3';
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
      accessKeyId: "AKIAYS2NSTU5LZENI7MW",
      secretAccessKey: "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"
  }
});

export async function GET() {
  try {

    let chartDates = []

    let dateObj = new Date()

    console.log(dateObj)
     
    


    const [yearToday, monthToday, dayToday] = dateObj.toISOString().split("T")[0].split('-'); // Split the date string into year, month, and day
    const todaysDate = `${dayToday}/${monthToday}/${yearToday}`
    console.log(dateObj.toLocaleDateString())
    const firstDay = `$01/${monthToday}/${dayToday}`
   
    let todaysViolations = await dbOperations.getVioationsCountByDate(todaysDate)
    let monthlyViolations = await dbOperations.getVioationsCountByDateRange(firstDay,todaysDate)

    let peakHoursToday = await dbOperations.getCountsByHourForDate(todaysDate)
    let peakHoursMonthly = await dbOperations.getCountsByHourForDateRange(firstDay,todaysDate)

    let vulnerableZoneToday = await dbOperations.getCountsByZoneForDate(todaysDate)
    let vulnerableZoneMonthly = await dbOperations.getCountsByZoneForDateRange(firstDay,todaysDate)
    
    let getLast5Violations = await dbOperations.getLast5Violations()

    let chartDateObj = new Date()

    chartDateObj.setDate(chartDateObj.getDate() - 7);

    const [yearChart, monthChart, dayChart] = chartDateObj.toISOString().split("T")[0].split('-');

    let chartDate = `${dayChart}/${monthChart}/${yearChart}`

    let groupedViolationsData = await dbOperations.getVioationsGroupedByDate(chartDate, todaysDate)

    let data = []

    while (chartDateObj <= dateObj) {
      if (!groupedViolationsData.some(obj => obj['date'] == chartDate)){
        groupedViolationsData.push({"date": chartDate, "violations": 0})
      }
      chartDateObj.setDate(chartDateObj.getDate() + 1);
      const [yearChart, monthChart, dayChart] = chartDateObj.toISOString().split("T")[0].split('-');
      chartDate = `${dayChart}/${monthChart}/${yearChart}`
    }

    // console.log(getLast5Violations)
    
    return NextResponse.json({
        "isLoading": true,
        "totalIntrusionsToday": todaysViolations, // done
        "peakHoursToday": peakHoursToday, // done
        "vulnerableZoneToday": vulnerableZoneToday, // done
        "totalIntrusionsMonthly": monthlyViolations, // done
        "peakHoursMonthly": peakHoursMonthly, //done
        "vulnerableZoneMonthly": vulnerableZoneMonthly, // done
        "last5Intrusion": getLast5Violations,
        "chartData": groupedViolationsData
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch today\'s statistics' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    
    const body = await req.json()
    const check = await checkFor30sec(body.camera)
    console.log(body)
    if(check == true){
      return NextResponse.json({"msg": "Already vioaltion present for camera"});
    }
    const result = await dbOperations.insert(body);

    const resultImageUrl = await uploadToS3(body.image)
    const components =  [
      {
        "type": "header",
        "parameters": [
          {
            "type": "image",
            "image": {
              "link": resultImageUrl
            }
          }
        ]
      },
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": body.camera
          },
          {
            "type": "text",
            "text": "2"
          },
          {
            "type": "text",
            "text": `${body.time} on ${body.date}`
          }
        ]
      }
    ]

    let numArray = ["8349453196", "9826799073", "8319690971", "7509389575", "9669437111", "8982167465"]
    let returnResult = []
    for (let phonenumber of numArray){
      console.log(phonenumber)
      returnResult.push(await sendTemplateMessage(components, phonenumber));
    }
    
    return NextResponse.json(returnResult);
   
    
  } catch (error) {
    return NextResponse.json(
      { error: error },
      { status: 500 }
    );
  }
}

async function uploadToS3(localImagePath) {
  try {
      // Read the file from local path
      console.log(__dirname)
      const srcPath = path.join(__dirname, '..', '..','..','..');
      console.log(srcPath)
      const localImagePathTest = path.join(srcPath, 'public', localImagePath);
      const fileContent = fs.readFileSync(localImagePathTest);
      const fileName = `intrusion_${Date.now()}${path.extname(localImagePathTest)}`;

      const uploadParams = {
          Bucket: "instusion-images",
          Key: fileName,
          Body: fileContent,
          ContentType: 'image/png', // or 'image/png' based on your image type
          ACL: 'public-read'
      };

      await s3Client.send(new PutObjectCommand(uploadParams));

      // Construct the URL
      const imageUrl = `https://instusion-images.s3.ap-south-1.amazonaws.com/${fileName}`;

      
      return imageUrl;

  } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
  }
}

async function sendTemplateMessage(components, phonenumber) {
  try {
    const response = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v21.0/453514494522997/messages`,
      headers: {
        'Authorization': `Bearer EAAScbPU5JAgBOwFvD5nE5UwnDsiNV2kpeE7OdKaiWXq3Hh3TcpIZA9xQDTELG17yOYSvJTXLENDGKVThZCImim5kRVZBKUOSUkeVZB2F9tlbAcv27NnLfcCmxlKwpMW0r31hND1JZA47csNPM8tSdZCn87CmAIyaXECjpJljICffLZBpJ4p3PjBJ6MJwtWGiYIWZAwZDZD`,
        'Content-Type': 'application/json',
      },
      data: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phonenumber,
        type: 'template',
        template: {
          name: "intrusion_detection_system",
          language: {
            code: 'en'
          },
          components: components
        }
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
    throw error;
  }
}

const cameraThrottle = new Map();

async function checkFor30sec(camera) {
    
    const currentTime = Date.now();
    const lastSubmission = cameraThrottle.get(camera);

    // Clean up old entries
    if (lastSubmission && currentTime - lastSubmission > 30000) {
        cameraThrottle.delete(camera);
    }

    if (lastSubmission && currentTime - lastSubmission < 30000) {
        const remainingTime = Math.ceil((30000 - (currentTime - lastSubmission)) / 1000);
        return true
    }

    // Update timestamp for this camera
    cameraThrottle.set(camera, currentTime);
    return false
};