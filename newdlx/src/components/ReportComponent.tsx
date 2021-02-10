/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models, Embed, IReportEmbedConfiguration, IEmbedSettings } from 'powerbi-client';
import axios from 'axios';

interface IReportProps {
    reportId: string;
}
interface apiConfig {
    accessToken: string;
    embedUrl: string;
    expiry: string;
    status: number;
    reportId: string;
}

const layoutSettings = {
    displayOption: models.DisplayOption.ActualSize,
} as models.ICustomLayout;

const renderSettings = {
    layoutType: models.LayoutType.Custom,
    customLayout: layoutSettings,
} as IEmbedSettings;

export default function ReportComponent(props: IReportProps) {
    const [timer, setTimer] = React.useState<NodeJS.Timeout | undefined>();

    const [sampleReportConfig, setReportConfig] = React.useState<IReportEmbedConfiguration>({
        type: 'report',
        embedUrl: '',
        tokenType: models.TokenType.Embed,
        id: '',
        accessToken: '',
        settings: renderSettings,
    });

    const getReport = async () =>
        axios
            .post<apiConfig>('http://localhost:5300/getReport', { reportId: props.reportId })
            .then((resp): void => {
                const reportCon = {
                    ...sampleReportConfig,
                    embedUrl: resp.data.embedUrl,
                    accessToken: resp.data.accessToken,
                    id: resp.data.reportId,
                };
                setReportConfig(reportCon);
            })
            .catch((err) => console.log(err));

    React.useEffect(() => {
        console.log('got report');
        timer && clearInterval(timer);
        getReport();
        setTimer(setInterval(() => getReport(), 1000 * 60 * 10));
        return () => {
            timer && clearInterval(timer);
        };
    }, [props.reportId]);

    return (
        <div>
            {sampleReportConfig.id && (
                <PowerBIEmbed
                    embedConfig={sampleReportConfig}
                    //    eventHandlers = {eventHandlersMap}
                    cssClassName={'report-style-class'}
                    getEmbeddedComponent={(embedObject: Embed) => {
                        console.log(`Embedded object of type "${embedObject.embedtype}" received`);
                        //  setReport(embedObject as Report);
                    }}
                />
            )}
        </div>
    );
}
