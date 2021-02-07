import React, {useEffect, useState, FunctionComponent } from 'react';
import axios from 'axios';
import { useTheme } from '@material-ui/core/styles';
//import SalesReports from "./components/showReport";
import { PowerBIEmbed } from 'powerbi-client-react';
import { models, Report, Embed,  IEmbedConfiguration, service, Page, IReportEmbedConfiguration, IEmbedSettings } from 'powerbi-client';

import "./App.css"
interface apiConfig {
  accessToken: string,
  embedUrl: any[],
  expiry: string,
  status: number
}

const layoutSettings = {
   displayOption: models.DisplayOption.ActualSize
} as models.ICustomLayout

const renderSettings = {
  layoutType: models.LayoutType.Custom,
  customLayout: layoutSettings
} as IEmbedSettings

function App (): JSX.Element {

	const [report, setReport] = useState<Report>();

  const [sampleReportConfig, setReportConfig] = useState<IReportEmbedConfiguration>({
		type: 'report',
    embedUrl: '',
    tokenType: models.TokenType.Embed,
		id: '',
    accessToken: '',
		settings: renderSettings,
	});
  const [displayMessage, setMessage] = useState(`The report is bootstrapped. Click the Embed Report button to set the access token`);

  const theme = useTheme()
  const getToken = async () => axios.get<apiConfig>('http://localhost:5300/getEmbedToken')
                                    .then( resp => {
                                      let reportCon = {
                                          ...sampleReportConfig,
                                          embedUrl: resp.data.embedUrl[0].embedUrl,
                                          accessToken: resp.data.accessToken,
                                          id: resp.data.embedUrl[0].reportId
                                      }
                                      setReportConfig(reportCon)
                                    })
                                    .catch(err => console.log(err));
  useEffect(() => {    
    console.log('call...')
    getToken();
    let timerId = setInterval(() => getToken(), 1000*60*10);
 //   timerId;
    return () => {
      clearInterval(timerId)
    };
  }, []);



	// Map of event handlers to be applied to the embedding report
	// const eventHandlersMap = new Map([
	// 	['loaded', function () {
	// 		console.log('Report has loaded');
	// 	}],
	// 	['rendered', function () {
	// 		console.log('Report has rendered');
			
	// 		// Update display message
	// 		setMessage('The report is rendered')
	// 	}],
	// 	['error', async function (event?: service.ICustomEvent<any>) { 
	// 		if (event) {
  //       console.error(event.detail);
  //       await getToken();
  //       report && report.refresh().catch(error => { console.log( error ) });
	// 		}
	// 	}]
	// ]);

  // const testClick = async () => {
  //   await getToken();
  //   report && report.refresh().catch(error => { console.log( error ) });
  // }
	// const changeSettings = () => {
	
	// 	setReportConfig({
	// 		...sampleReportConfig,
	// 		settings: {
	// 			panes: {
	// 				filters: {
	// 					expanded: false,
	// 					visible: false
	// 				}
	// 			}
	// 		}
	// 	});
	// };


 return (

  <div >{sampleReportConfig.id && <PowerBIEmbed
    embedConfig = {sampleReportConfig}
//    eventHandlers = {eventHandlersMap}
    cssClassName = { "report-style-class" }
    getEmbeddedComponent = { (embedObject:Embed) => {
      console.log(`Embedded object of type "${ embedObject.embedtype }" received`);
      setReport(embedObject as Report);
    } }
  />}
  </div>

 )
}

export default App;
