import { AlertService } from "./alert.service";

export class AlertController {
  constructor(private alertService: AlertService) {}

  async createAlert(req: any, res: any) {
    try {
      const alert = await this.alertService.createAlert(req.body);
      res.status(201).json(alert);
    } catch (error) {
      res.status(400).json({ message: "Error creating alert", error });
    }
  }

  async getAlerts(req: any, res: any) {
    try {
      const alerts = await this.alertService.getAlertsByUserId(
        req.query.userId as string
      );
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching alerts", error });
    }
  }

  async getAlertById(req: any, res: any) {
    try {
      const alert = await this.alertService.getAlertById(req.params.id);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ message: "Error fetching alert", error });
    }
  }

  async updateAlert(req: any, res: any) {
    try {
      const alert = await this.alertService.updateAlert(
        req.params.id,
        req.body
      );
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      res.status(400).json({ message: "Error updating alert", error });
    }
  }

  async deleteAlert(req: any, res: any) {
    try {
      const result = await this.alertService.deleteAlert(req.params.id);
      if (!result) {
        return res.status(404).json({ message: "Alert not found" });
      }
      res.json({ message: "Alert deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting alert", error });
    }
  }

  async getActiveAlerts(req: any, res: any) {
    try {
      const alerts = await this.alertService.getActiveAlertsByUserId(
        req.params.userId
      );
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching active alerts", error });
    }
  }
}
