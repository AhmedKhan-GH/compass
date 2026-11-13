library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        status : in std_logic_vector(7 downto 0);
        mask : in std_logic_vector(7 downto 0);
        critical : in std_logic;
        warning : in std_logic;
        shown : out std_logic_vector(7 downto 0);
        alert_code : out std_logic_vector(1 downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    -- TODO: implement the required behavior.
    shown <= (others => '0');
    alert_code <= (others => '0');
end architecture;
