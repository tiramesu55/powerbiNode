/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models, Report, Embed, Page, service, IReportEmbedConfiguration, IEmbedSettings } from 'powerbi-client';
import axios from 'axios';
// import { useMediaQuery } from '@material-ui/core';
// import { useTheme } from '@material-ui/core/styles';

import withWidth from '@material-ui/core/withWidth';

interface IReportProps {
    reportId: string;
    width: string;
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

//to get to div container of the embedded report
const reportContainer = React.createRef<HTMLDivElement>();
let reportContainerHtml: HTMLDivElement;

function ReportComponent(props: IReportProps) {
    // const theme = useTheme();
    // const isMobileViewport = useMediaQuery(theme.breakpoints.down('xs'), {
    //     noSsr: true,
    // });
    const renderSettings = {
        filterPaneEnabled: false,
        navContentPaneEnabled: false,
        layoutType: models.LayoutType.Custom, //
        //layoutType: isMobileViewport ? models.LayoutType.MobilePortrait : models.LayoutType.Custom,
        customLayout: layoutSettings,
    } as IEmbedSettings;
    const [timer, setTimer] = React.useState<NodeJS.Timeout | undefined>();
    const [report2, setReport] = React.useState<Report | undefined>();

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
    React.useEffect(() => {
        // console.log(reports);
        console.log(props.width);
        reportContainerHtml = reportContainer.current!;
        console.log(reportContainerHtml);
        setContainerHeight(report2!, reportContainerHtml);
    }, [props.width]);
    function setContainerHeight(report: Report, hostContainer: HTMLDivElement): void {
        report &&
            report.getPages().then((p: Array<Page>) => {
                const reportHeight = p[0].defaultSize.height;
                const reportWidth = p[0].defaultSize.width;
                if (reportWidth! > 0) {
                    const ratio = reportHeight! / reportWidth!;
                    const containerWidth = hostContainer.clientWidth;
                    const newContainerHeight = Math.round(containerWidth * ratio) + 5;
                    console.log(newContainerHeight);
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
                        setReport(embedObject as Report);
                    }}
                    eventHandlers={
                        new Map([
                            [
                                'loaded',
                                () => {
                                    //@slava when loaded we set container height
                                    reportContainerHtml = reportContainer.current!;
                                    console.log(reportContainerHtml);
                                    setContainerHeight(report, reportContainerHtml);
                                },
                            ],
                            [
                                'rendered',
                                () => {
                                    console.log('Report rendered');
                                    // reportContainerHtml = reportContainer.current!;
                                    // console.log(reportContainerHtml);
                                    // setContainerHeight(report, reportContainerHtml);
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
export default withWidth()(ReportComponent);
