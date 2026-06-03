export function withdrawalStatusLabel(status: string): string {
  switch (status) {
    case "succeeded":
      return "Completed";
    case "failed":
      return "Failed";
    case "pending":
      return "Processing";
    default:
      return status;
  }
}

export function withdrawalStatusBadgeVariant(
  status: string
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "succeeded":
      return "success";
    case "failed":
      return "danger";
    case "pending":
      return "warning";
    default:
      return "default";
  }
}
