import { Injectable } from '@nestjs/common';
import got, { Options } from 'got';
import { DOCUWARE } from 'src/config/docuware.config';
import * as DWRest from 'src/types/DW_Rest';
import { devLog, systemLog } from 'src/utils/devTools';
import { CookieJar } from 'tough-cookie';
import * as fs from 'fs';

@Injectable()
export class DocuwareService {
  platformRoot: string;
  docuWare_request_config: Options;

  constructor() {
    this.platformRoot = DOCUWARE.URL;
    this.docuWare_request_config = { cookieJar: new CookieJar() };
  }

  async login({ userName = '', password = '' }): Promise<boolean> {
    systemLog('START: login');
    const response = await got.post(
      `${DOCUWARE.URL}${DOCUWARE.PLATFORM}/Account/Logon`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        form: {
          UserName: userName,
          Password: password,
          RedirectToMyselfInCaseOfError: 'false',
          RememberMe: 'false',
          HostID: DOCUWARE.HOST_ID,
        },
      },
    );

    // set cookie
    const respondedCookies = response.headers['set-cookie'];
    if (respondedCookies && respondedCookies.length > 0) {
      const cookieJar = new CookieJar();
      respondedCookies.forEach((cookieString) => {
        //add cookies to jar
        cookieJar.setCookie(cookieString, this.platformRoot);
      });
      //Set the culture so our DocuWare Platform will respond with correct formats
      cookieJar.setCookie('DWFormatCulture=de', this.platformRoot);
      //set jar to const http client config, so all following requests will get the cookie jar as well
      this.docuWare_request_config.cookieJar = cookieJar;

      systemLog('END: login');
      return true;
    }

    return false;
  }
  /**
   * Send query to get results
   *
   * @param {string} queryUrl
   * @returns {Promise<DWRest.IDocumentsQueryResult>}
   */
  async getQueryResult(queryString: string): Promise<any> {
    systemLog('START: GET QUERY RESULT');
    const response = await got.get(`${DOCUWARE.URL}${queryString}`, {
      cookieJar: this.docuWare_request_config.cookieJar,
      headers: {
        Accept: 'application/json',
      },
    });
    devLog(response.body);
    systemLog('END: GET QUERY RESULT');

    return JSON.parse(response.body);
  }

  /**
   * search
   *
   * @param {DWRest.IDialogExpression} dialogExpression
   * @returns {Promise<any>}
   */
  async search(
    dialogExpression: DWRest.IDialogExpression,
    count = 1300,
  ): Promise<any> {
    systemLog('START: GET SEARCH URL');
    const responseGenerateUrl = await got.post(
      `${DOCUWARE.URL}${DOCUWARE.PLATFORM}/FileCabinets/${DOCUWARE.FILE_CABINET_ID}/Query/DialogExpressionLink?fields=DWDOCID&dialogId=${DOCUWARE.SEARCH_DIALOG_ID}&count=${count}`,
      {
        cookieJar: this.docuWare_request_config.cookieJar,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dialogExpression),
      },
    );

    const queryString = responseGenerateUrl.body;

    devLog('query string =>', queryString);
    systemLog('END: GET SEARCH URL');

    return await this.getQueryResult(queryString);
  }

  async update(
    document: DWRest.IDocument,
    fieldsToUpdate: DWRest.IFieldList,
  ): Promise<any> {
    systemLog('START: UPDATE A DOCUMENT FIELDS');
    const response = await got.post(
      `${DOCUWARE.URL}${DOCUWARE.PLATFORM}/FileCabinets/${DOCUWARE.FILE_CABINET_ID}/Documents/${document.Id}/Fields`,
      {
        cookieJar: this.docuWare_request_config.cookieJar,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fieldsToUpdate),
      },
    );

    devLog('update response =>', response.body);
    systemLog('END: UPDATE A DOCUMENT FIELDS');

    return response.body;
  }

  async upload(file: string): Promise<any> {
    systemLog('START: UPLOAD A DOCUMENT');
    const response = await got.post(
      `${DOCUWARE.URL}${DOCUWARE.PLATFORM}/FileCabinets/${DOCUWARE.FILE_CABINET_ID}/Documents`,
      {
        cookieJar: this.docuWare_request_config.cookieJar,
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
        form: {
          'file[]': {
            value: fs.createReadStream(file),
            options: {
              filename: file,
              contentType: null,
            },
          },
        },
      },
    );

    devLog('upload response =>', response.body);
    systemLog('END: UPLOAD A DOCUMENT');

    return JSON.parse(response.body);
  }
}
