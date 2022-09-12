import { NestFactory } from '@nestjs/core';
import { DocuwareModule } from './docuware/docuware.module';
import { DocuwareService } from './docuware/docuware.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(DocuwareModule);
  const docuwareService = app.get(DocuwareService);

  await docuwareService.login();
  await docuwareService.search();
  await docuwareService.update();
  await docuwareService.upload();
}
bootstrap();
