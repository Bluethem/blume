require "test_helper"

class Api::V1::MedicoHorariosControllerTest < ActionDispatch::IntegrationTest
  test "should get disponibles" do
    get api_v1_medico_horarios_disponibles_url
    assert_response :success
  end
end
