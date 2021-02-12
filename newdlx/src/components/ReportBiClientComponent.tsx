/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React, { useEffect } from 'react';
import { useTheme, makeStyles } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import ReportEmbedding from '../PowerBi/ReportEmbeddingClass';

export interface IReportProps {
    reportId: string;
}

function ReportBiClientComponent(props: IReportProps) {
    const reportContainer = React.createRef<HTMLDivElement>();
    const reportEmbedding = new ReportEmbedding();

    const useStyles = makeStyles(() => ({
        container: {
            height: isMobileViewport ? 'calc(100vh - 140px)' : '100%',
        },
    }));

    const theme = useTheme();
    const isMobileViewport = useMediaQuery(theme.breakpoints.down('xs'), {
        noSsr: true,
    });

    const classes = useStyles();

    const embeding = (reportId: string, reportContainer: HTMLDivElement, isMobileViewport: boolean): void => {
        reportEmbedding.resetElem(reportContainer);
        reportEmbedding.embedReport(reportId, reportContainer, isMobileViewport);
    };

    useEffect(() => {
        reportContainer &&
            reportContainer.current &&
            embeding(props.reportId, reportContainer.current, isMobileViewport);
    }, [props.reportId]);

    return <div ref={reportContainer} className={classes.container} />;
}
export default ReportBiClientComponent;
