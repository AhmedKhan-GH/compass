library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.weather_pkg.all;
entity weather_wrapper is
    port (
    packed        : out   std_logic_vector(15 downto 0);
    cold_temp     : out   integer;
    warm_temp     : out   integer;
    cold_humidity : out   natural;
    warm_humidity : out   natural;
    cold_valid    : out   std_logic;
    warm_valid    : out   std_logic
    );
end entity weather_wrapper;
architecture sim of weather_wrapper is
    constant cold : weather_report_t := (
    humidity => 73,
    valid => '1',
    temperature => -12
    );
    constant warm_word : std_logic_vector(15 downto 0) :=
    std_logic_vector(to_signed(25, 8)) &
    std_logic_vector(to_unsigned(42, 7)) & '0';
    constant warm : weather_report_t := unpack(warm_word);
    constant again : weather_report_t := unpack(pack(cold));
    begin
    packed <= pack(cold);
    cold_temp <= again.temperature;
    cold_humidity <= again.humidity;
    cold_valid <= again.valid;
    warm_temp <= warm.temperature;
    warm_humidity <= warm.humidity;
    warm_valid <= warm.valid;
end architecture sim;
