/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as pbi from 'powerbi-client';
import { IEmbedConfiguration, IEmbedSettings } from 'powerbi-client';
import * as models from 'powerbi-models';

interface IReportEmbedModel {
    id: string;
    embedUrl: string;
    accessToken: string;
}

export default class ReportEmbedding {
    private pbiService: pbi.service.Service;

    constructor() {
        this.pbiService = new pbi.service.Service(
            pbi.factories.hpmFactory,
            pbi.factories.wpmpFactory,
            pbi.factories.routerFactory,
        );
    }
    public applyReportFilters(filters: Array<pbi.models.IFilter>, hostContainer: any): void {
        const report = this.pbiService.get(hostContainer) as pbi.Report;
        report.setFilters(filters).catch((error) => {
            console.log('Error applying filter', error);
        });
    }
    public resetElem(hostContainer: HTMLDivElement): void {
        this.pbiService.reset(hostContainer);
    }

    public embedReport(reportId: string, hostContainer: HTMLDivElement, showMobileLayout: boolean): void {
        this.getReportEmbedModel(reportId)
            .then((apiResponse) => this.getReportEmbedModelFromResponse(apiResponse))
            .then((responseContent) => this.buildReportEmbedConfiguration(responseContent, showMobileLayout))
            .then((reportConfiguration) =>
                this.runEmbedding(reportConfiguration, hostContainer, reportId, showMobileLayout),
            );
    }

    private getReportEmbedModel(reportId: string): Promise<Response> {
        const request = new Request('http://localhost:7071/api/getReport', {
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
        debugger;
        const report = this.pbiService.embed(hostContainer, reportConfiguration) as pbi.Report;

        report.off('loaded');
        report.off('error');

        report.on('loaded', () => {
            this.handleTokenExpiration(report, reportName);
            this.setContainerHeight(report, hostContainer, showMobileLayout).then(() => this.showReport(hostContainer));
        });

        report.on('error', (e) => {
            const error = e.detail as models.IError;
            if (error.level! > models.TraceType.Error) {
                console.log('Embedded Error: ', error);
            }
            //need to remove tell react to stop progress indicator which is animated gif
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
        return report.getPages().then((p: Array<pbi.Page>) => {
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
    private showReport(hostContainer: HTMLDivElement): void {
        window.setTimeout(() => {
            console.log(hostContainer);
            hostContainer.style.visibility = 'visible';
        }, 300);
    }
}
