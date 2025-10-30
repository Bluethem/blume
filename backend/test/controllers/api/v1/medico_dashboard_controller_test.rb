require "test_helper"

class Api::V1::MedicoDashboardControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get api_v1_medico_dashboard_index_url
    assert_response :success
  end

  test "should get estadisticas" do
    get api_v1_medico_dashboard_estadisticas_url
    assert_response :success
  end
end
