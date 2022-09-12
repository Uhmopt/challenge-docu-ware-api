import { NestFactory } from '@nestjs/core';
import { DOCUWARE } from './config/docuware.config';
import { DocuwareModule } from './docuware/docuware.module';
import { DocuwareService } from './docuware/docuware.service';
import { ItemChoiceType, Operation } from './types/DW_Rest';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(DocuwareModule);
  const docuwareService = app.get(DocuwareService);

  // login
  await docuwareService.login({
    userName: DOCUWARE.USER_NAME,
    password: DOCUWARE.PASSWORD,
  });

  // search
  await docuwareService.search({
    Condition: [{ DBName: 'STATUS', Value: ['NOT_PROCESSED'] }],
    Operation: Operation.And,
  });

  // update document
  await docuwareService.update(
    { Id: 89 },
    {
      Field: [
        {
          fieldName: 'STATUS',
          fieldLabel: 'Status',
          isNull: false,
          readOnly: false,
          item: 'Rowell',
          itemElementName: ItemChoiceType.String,
        },
      ],
    },
  );

  // upload a test document
  await docuwareService.upload(DOCUWARE.TEST_FILE);
}

bootstrap();
