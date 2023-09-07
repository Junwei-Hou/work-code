// openai.service.ts
import { Injectable } from '@nestjs/common';
import { Request, Response } from "express";
import OpenAI from 'openai';
import fetch from 'node-fetch';
import { ConfigService } from "../config/config.service";
import { HttpsProxyAgent } from 'https-proxy-agent';
import Configuration from "openai";
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
}
@Injectable()
export class OpenAIService {
  private openAI: OpenAI;
  constructor(private configService: ConfigService) {}

  async generateText(messageString: string,  ws:any ): Promise<string> {
    const proxy = "http://127.0.0.1:7890"; // your proxy URL
    const agent = new HttpsProxyAgent(proxy);
    const result = JSON.parse(messageString)["prompt"];
    
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.configService.get("OPENAI_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // model: 'gpt-3.5-turbo',
            model: 'gpt-4',
            messages: [
              {
                "role": "user",
                "content": result
              }
            ],
            temperature: 0.6,
            stream: true
          }),
          agent: agent
        });

        // receive data from chatgpt as a stream way
        let rawData = '';
        let fullContent = '';
        response.body.on('data', (chunk) => {
          rawData += chunk.toString('utf8');
          const lines = rawData.split('\n');
          rawData = lines.pop(); //  save data in the last line which may be incomplete
          lines.forEach(line => {
            if (line.trim().startsWith('data:')) {
              const jsonLine = line.trim().substring(5); // remove prefix of "data:" 
              // try to parse if there is no "[DONE]" 
              if (jsonLine.trim() !== '[DONE]') {
                try {
                  const jsonData = JSON.parse(jsonLine);
                  if (jsonData.choices && jsonData.choices[0] && jsonData.choices[0].delta && jsonData.choices[0].delta.content !== undefined) {
                    fullContent += jsonData.choices[0].delta.content;
                    console.log('******', fullContent);
                    // res.write(fullContent);
                    // res.write(`data: ${fullContent}\n\n`)
                    ws.send(jsonData.choices[0].delta.content);
                  }
                } catch (error) {
                  console.error('There is an error when parse data：', error);
                }
              }
            }
          });
        });
        response.body.on('end', () => {
          ws.send(fullContent);
        });
      } catch (error) {
        console.error('An error occurred:', error);
      }
    })
  }
}


