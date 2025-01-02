import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '../../../db/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    console.log(body)
    
    const result = await dbOperations.getLoginInfo(body.email, body.password);
    
    let resObj: any = {}
    console.log(result)
    if(result.length){
        resObj = {
            "token": "token@arctic-geese"
        }
    } else{
        resObj = {
            "message": "Incorrect Credentials"
        }
    }
    
    return NextResponse.json(resObj);
   
    
  } catch (error) {
    return NextResponse.json(
      { error: error },
      { status: 500 }
    );
  }
}