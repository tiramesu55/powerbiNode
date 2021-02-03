import React, {useEffect, useState, FunctionComponent } from 'react';
import axios from 'axios';
import { useTheme } from '@material-ui/core/styles';
import SalesReports from "./components/showReport";
import { PowerBIEmbed } from 'powerbi-client-react';
import { models, Report, Embed, IEmbedConfiguration, service, Page } from 'powerbi-client';
import "./App.css"
interface ReportConfig {
  type: string,
  tokenType: number,
  accessToken: string,
  embedUrl: string,
  reportId: string,
  expiry: string,
  status: number,
  settings: any
}

interface apiConfig {
  accessToken: string,
  embedUrl: any[],
  expiry: string,
  status: number
}
function App (): JSX.Element {

	const [report, setReport] = useState<Report>();

	// API end-point url to get embed config for a sample report
	const sampleReportUrl = 'https://aka.ms/sampleReportEmbedConfig';

  const [sampleReportConfig, setReportConfig] = useState<ReportConfig>({
		type: 'report',
    embedUrl: '',
    tokenType: models.TokenType.Embed,
		reportId: '',
    accessToken: '',
    expiry: '',
    status: 0,
		settings: {
      panes: {
        filters: {
          expanded: true,
          visible: true
        }
      }
    },
	});
  const [displayMessage, setMessage] = useState(`The report is bootstrapped. Click the Embed Report button to set the access token`);

  const theme = useTheme()
  const getToken = async () => axios.get<apiConfig>('http://localhost:5300/getEmbedToken')
                                    .then( resp => {
                                      let reportCon = {
                                          ...sampleReportConfig,
                                          embedUrl: resp.data.embedUrl[0].embedUrl,
                                          accessToken: resp.data.accessToken,
                                          reportId: resp.data.embedUrl[0].reportId,
                                          expiry: resp.data.expiry,
                                          status: resp.data.status
                                      }
                                      setReportConfig(reportCon)
                                    })
                                    .catch(err => console.log(err));
  useEffect(() => {    
    getToken();
  }, []);



	// Map of event handlers to be applied to the embedding report
	const eventHandlersMap = new Map([
		['loaded', function () {
			console.log('Report has loaded');
		}],
		['rendered', function () {
			console.log('Report has rendered');
			
			// Update display message
			setMessage('The report is rendered')
		}],
		['error', async function (event?: service.ICustomEvent<any>) { 
			if (event) {
        console.error(event.detail);
        await getToken();
        report && report.refresh().catch(error => { console.log( error ) });
			}
		}]
	]);

  const testClick = async () => {
    await getToken();
    report && report.refresh().catch(error => { console.log( error ) });
  }
	const changeSettings = () => {
		// Update the state "sampleReportConfig" and re-render DemoApp component
		setReportConfig({
			...sampleReportConfig,
			settings: {
				panes: {
					filters: {
						expanded: false,
						visible: false
					}
				}
			}
		});
	};


 return (
   <div>
  <div style={{height: "100%"}}>{sampleReportConfig.status === 200 && <PowerBIEmbed
    embedConfig = {sampleReportConfig}
    eventHandlers = {eventHandlersMap}
    cssClassName = { "report-style-class" }
    getEmbeddedComponent = { (embedObject:Embed) => {
      console.log(`Embedded object of type "${ embedObject.embedtype }" received`);
      setReport(embedObject as Report);
    } }
  />}
  </div>
  <button onClick={testClick}>Test click</button>
  </div>
 )
}

export default App;
