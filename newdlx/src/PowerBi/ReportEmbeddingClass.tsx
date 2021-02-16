import * as pbi from 'powerbi-client';
import { IEmbedConfiguration, IEmbedSettings } from 'powerbi-client';
import * as models from 'powerbi-models';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
interface IReportEmbedModel {
    id: string;
    embedUrl: string;
    accessToken: string;
}

export default class ReportEmbedding {
    private pbiService: pbi.service.Service;
    private instAI: ApplicationInsights;
    constructor() {
        this.pbiService = new pbi.service.Service(
            pbi.factories.hpmFactory,
            pbi.factories.wpmpFactory,
            pbi.factories.routerFactory,
        );
        this.instAI = new ApplicationInsights({
            config: { instrumentationKey: '56ef7020-f083-4c06-af79-824503358d56' },
        });
        this.instAI.loadAppInsights();
    }

    public resetElem(hostContainer: HTMLDivElement): void {
        this.pbiService.reset(hostContainer);
    }

    public embedReport(reportId: string, hostContainer: HTMLDivElement, showMobileLayout: boolean): void {
        this.instAI.trackEvent({ name: 'embed' });
        this.getReportEmbedModel(reportId)
            .then((apiResponse) => this.getReportEmbedModelFromResponse(apiResponse))
            .then((responseContent) => this.buildReportEmbedConfiguration(responseContent, showMobileLayout))
            .then((reportConfiguration) => {
                this.runEmbedding(reportConfiguration, hostContainer, reportId, showMobileLayout);
                this.instAI.stopTrackEvent('embed');
            });
    }

    private getReportEmbedModel(reportId: string): Promise<Response> {
        const request = new Request('http://localhost:5300/getReport', {
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({ reportId: reportId }),
        });

        return fetch(request);
    }

    private getReportEmbedModelFromResponse(response: Response): Promise<any> {
        if (response.status === 200) {
            return response.json();
        } else throw 'Error fetching report embed model';
    }

    private buildReportEmbedConfiguration(
        embedModel: IReportEmbedModel,
        showMobileLayout: boolean,
    ): IEmbedConfiguration {
        const layoutSettings = {
            displayOption: models.DisplayOption.FitToWidth,
        } as models.ICustomLayout;

        const renderSettings = {
            filterPaneEnabled: false,
            navContentPaneEnabled: false,
            layoutType: showMobileLayout ? models.LayoutType.MobilePortrait : models.LayoutType.Custom,
            customLayout: layoutSettings,
        } as IEmbedSettings;

        return {
            id: embedModel.id,
            embedUrl: embedModel.embedUrl,
            accessToken: embedModel.accessToken,
            type: 'report',
            tokenType: pbi.models.TokenType.Embed,
            permissions: pbi.models.Permissions.Read,
            settings: renderSettings,
        } as IEmbedConfiguration;
    }

    private runEmbedding(
        reportConfiguration: IEmbedConfiguration,
        hostContainer: HTMLDivElement,
        reportName: string,
        showMobileLayout: boolean,
    ): void {
        const report = this.pbiService.embed(hostContainer, reportConfiguration) as pbi.Report;

        report.off('loaded');
        report.on('loaded', () => {
            this.handleTokenExpiration(report, reportName);
            this.setContainerHeight(report, hostContainer, showMobileLayout);
        });
    }

    private handleTokenExpiration(report: pbi.Embed, reportName: string) {
        const timeoutMilliseconds = 55 * 60 * 1000;
        setTimeout(() => {
            this.getReportEmbedModel(reportName)
                .then((apiResponse) => this.getReportEmbedModelFromResponse(apiResponse))
                .then((responseContent) => this.updateEmbedToken(responseContent, report, reportName));
        }, timeoutMilliseconds);
    }

    private updateEmbedToken(embedModel: IReportEmbedModel, report: pbi.Embed, reportName: string): void {
        report.setAccessToken(embedModel.accessToken).then(() => this.handleTokenExpiration(report, reportName));
    }

    private setContainerHeight(report: pbi.Report, hostContainer: HTMLDivElement, showMobileLayout: boolean) {
        report.getPages().then((p: Array<pbi.Page>) => {
            p[0].hasLayout(models.LayoutType.MobilePortrait).then((hasMobileLayout) => {
                if (!hasMobileLayout || !showMobileLayout) {
                    const reportHeight = p[0].defaultSize.height ? p[0].defaultSize.height : 0;
                    const reportWidth = p[0].defaultSize.width ? p[0].defaultSize.width : 1;

                    const ratio = reportHeight / reportWidth;
                    const containerWidth = hostContainer.clientWidth;
                    const newContainerHeight = Math.round(containerWidth * ratio) + 10;

                    hostContainer.style.height = `${newContainerHeight}px`;
                }
            });
        });
    }
}
