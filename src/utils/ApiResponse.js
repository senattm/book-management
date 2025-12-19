class ApiResponse {
  constructor(data = null, message = null, pagination = null) {
    this.success = true;
    this.data = data;
    if (message) this.message = message;
    if (pagination) this.pagination = pagination;
  }
}

module.exports = ApiResponse;
