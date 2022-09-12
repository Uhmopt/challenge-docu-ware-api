import { Injectable } from '@nestjs/common';

@Injectable()
export class DocuwareService {
  async login(): Promise<boolean> {
    return false;
  }

  async search(): Promise<boolean> {
    return false;
  }

  async update(): Promise<boolean> {
    return false;
  }

  async upload(): Promise<boolean> {
    return false;
  }
}
