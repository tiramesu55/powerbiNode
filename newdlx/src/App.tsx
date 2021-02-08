/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useEffect, useState } from 'react';
import axios from 'axios';
//import { useTheme } from '@material-ui/core/styles';
//import SalesReports from "./components/showReport";
import { PowerBIEmbed } from 'powerbi-client-react';
import { models, Report, Embed, IReportEmbedConfiguration, IEmbedSettings } from 'powerbi-client';

import './App.css';
interface apiConfig {
    accessToken: string;
    embedUrl: any[];
    expiry: string;
    status: number;
}

const layoutSettings = {
    displayOption: models.DisplayOption.ActualSize,
} as models.ICustomLayout;

const renderSettings = {
    layoutType: models.LayoutType.Custom,
    customLayout: layoutSettings,
} as IEmbedSettings;

const App = (): React.ReactElement => {
    const [report, setReport] = useState<Report>();

    const [sampleReportConfig, setReportConfig] = useState<IReportEmbedConfiguration>({
        type: 'report',
        embedUrl: '',
        tokenType: models.TokenType.Embed,
        id: '',
        accessToken: '',
        settings: renderSettings,
    });
    // const [displayMessage, setMessage] = useState(
    //     `The report is bootstrapped. Click the Embed Report button to set the access token`,
    // );

    //const theme = useTheme();
    const getToken = async () =>
        axios
            .get<apiConfig>('http://localhost:5300/getEmbedToken')
            .then((resp): void => {
                const reportCon = {
                    ...sampleReportConfig,
                    embedUrl: resp.data.embedUrl[0].embedUrl,
                    accessToken: resp.data.accessToken,
                    id: resp.data.embedUrl[0].reportId,
                };
                setReportConfig(reportCon);
            })
            .catch((err) => console.log(err));
    useEffect(() => {
        getToken();
        const timerId = setInterval(() => getToken(), 1000 * 60 * 10);
        return () => {
            clearInterval(timerId);
        };
    }, []);
    useEffect(() => {
        console.log('got report');
    }, [report]);
    return (
        <div>
            {sampleReportConfig.id && (
                <PowerBIEmbed
                    embedConfig={sampleReportConfig}
                    //    eventHandlers = {eventHandlersMap}
                    cssClassName={'report-style-class'}
                    getEmbeddedComponent={(embedObject: Embed) => {
                        console.log(`Embedded object of type "${embedObject.embedtype}" received`);
                        setReport(embedObject as Report);
                    }}
                />
            )}
        </div>
    );
};

export default App;
