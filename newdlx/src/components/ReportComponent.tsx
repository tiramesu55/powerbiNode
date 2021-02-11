/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models, Report, Embed, Page, service, IReportEmbedConfiguration, IEmbedSettings } from 'powerbi-client';
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
    displayOption: models.DisplayOption.FitToWidth,
} as models.ICustomLayout;

const renderSettings = {
    filterPaneEnabled: false,
    navContentPaneEnabled: false,
    layoutType: models.LayoutType.Custom, //
    //layoutType: showMobileLayout
    //    ? models.LayoutType.MobilePortrait
    //    : models.LayoutType.Custom,
    customLayout: layoutSettings,
} as IEmbedSettings;
//to get to div container of the embedded report
const reportContainer = React.createRef<HTMLDivElement>();
let reportContainerHtml: HTMLDivElement;

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

    let report: Report;
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

    function setContainerHeight(report: Report, hostContainer: HTMLDivElement): void {
        report.getPages().then((p: Array<Page>) => {
            const reportHeight = p[0].defaultSize.height;
            const reportWidth = p[0].defaultSize.width;
            if (reportWidth! > 0) {
                const ratio = reportHeight! / reportWidth!;
                const containerWidth = hostContainer.clientWidth;
                const newContainerHeight = Math.round(containerWidth * ratio) + 10;

                hostContainer.style.height = `${newContainerHeight}px`;
            }
        });
    }

    return (
        <div ref={reportContainer}>
            {sampleReportConfig.id && (
                <PowerBIEmbed
                    embedConfig={sampleReportConfig}
                    cssClassName={'report-style-class'}
                    getEmbeddedComponent={(embedObject: Embed) => {
                        console.log(`Embedded object of type "${embedObject.embedtype}" received`);
                        report = embedObject as Report;
                        //  setReport(embedObject as Report);
                    }}
                    eventHandlers={
                        new Map([
                            [
                                'loaded',
                                () => {
                                    //@slava when loaded we set container height
                                    reportContainerHtml = reportContainer.current!;
                                    setContainerHeight(report, reportContainerHtml);
                                },
                            ],
                            [
                                'rendered',
                                () => {
                                    console.log('Report rendered');
                                },
                            ],
                            [
                                'error',
                                (err?: service.ICustomEvent<any>) => {
                                    console.log(err?.detail);
                                },
                            ],
                        ])
                    }
                />
            )}
        </div>
    );
}
